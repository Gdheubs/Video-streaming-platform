/**
 * High-Risk Payment Gateway Integration
 * Supports CCBill, Segpay, and Epoch
 * CRITICAL: These are webhook handlers - must verify signatures
 */

import { Request, Response } from 'express';
import { createSubscription, renewSubscription } from './subscription.service';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * CCBill Webhook Handler (Postback)
 * https://kb.ccbill.com/Webhooks+User+Guide
 */
export const handleCCBillWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      eventType,
      subscriptionId,
      clientAccnum,
      clientSubacc,
      timestamp,
      transactionId,
      billedInitialPrice,
      accountingCurrency,
      email,
      dynamicPricingValidationDigest,
    } = req.body;

    // 1. Verify webhook signature (CRITICAL)
    const isValid = verifyCCBillSignature(req.body, dynamicPricingValidationDigest);
    if (!isValid) {
      console.error('Invalid CCBill webhook signature');
      res.status(401).send('Invalid signature');
      return;
    }

    // 2. Handle different event types
    switch (eventType) {
      case 'NewSaleSuccess':
        await handleNewSubscription({
          processor: 'ccbill',
          transactionId,
          email,
          amount: parseFloat(billedInitialPrice),
          currency: accountingCurrency,
        });
        break;

      case 'RenewalSuccess':
        await handleRenewal({
          originalTransactionId: subscriptionId,
          newTransactionId: transactionId,
        });
        break;

      case 'Cancellation':
        await handleCancellation(subscriptionId);
        break;

      case 'Chargeback':
        await handleChargeback(transactionId);
        break;

      default:
        console.log('Unhandled CCBill event:', eventType);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('CCBill webhook error:', error);
    res.status(500).send('Error');
  }
};

/**
 * Segpay Webhook Handler
 * https://segpay.com/developer-guide/webhooks
 */
export const handleSegpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      action,
      x_trxid,
      x_email,
      x_amount,
      x_currency,
      x_auth_key,
    } = req.body;

    // 1. Verify auth key
    const isValid = verifySegpaySignature(req.body, x_auth_key);
    if (!isValid) {
      console.error('Invalid Segpay webhook signature');
      res.status(401).send('Invalid signature');
      return;
    }

    // 2. Handle events
    switch (action) {
      case 'sale':
        await handleNewSubscription({
          processor: 'segpay',
          transactionId: x_trxid,
          email: x_email,
          amount: parseFloat(x_amount),
          currency: x_currency,
        });
        break;

      case 'rebill':
        await handleRenewal({
          originalTransactionId: x_trxid,
          newTransactionId: `${x_trxid}-${Date.now()}`,
        });
        break;

      case 'cancel':
        await handleCancellation(x_trxid);
        break;

      default:
        console.log('Unhandled Segpay event:', action);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Segpay webhook error:', error);
    res.status(500).send('Error');
  }
};

/**
 * Epoch Webhook Handler
 */
export const handleEpochWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      action,
      pi_code,
      ans,
      email,
      amount,
      currency,
      hash,
    } = req.body;

    // 1. Verify hash
    const isValid = verifyEpochSignature(req.body, hash);
    if (!isValid) {
      console.error('Invalid Epoch webhook signature');
      res.status(401).send('Invalid signature');
      return;
    }

    // 2. Handle events
    switch (action) {
      case 'sale':
        await handleNewSubscription({
          processor: 'epoch',
          transactionId: ans,
          email,
          amount: parseFloat(amount),
          currency,
        });
        break;

      case 'rebill':
        await handleRenewal({
          originalTransactionId: pi_code,
          newTransactionId: ans,
        });
        break;

      case 'cancel':
        await handleCancellation(pi_code);
        break;

      default:
        console.log('Unhandled Epoch event:', action);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Epoch webhook error:', error);
    res.status(500).send('Error');
  }
};

/**
 * Handle new subscription from payment
 */
const handleNewSubscription = async (data: any): Promise<void> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    console.error('User not found for email:', data.email);
    return;
  }

  // Extract creator ID from custom field (set during checkout)
  // In production, you'd pass this via payment processor's custom fields
  const creatorId = process.env.DEFAULT_CREATOR_ID || user.id;

  await createSubscription({
    subscriberId: user.id,
    creatorId,
    processor: data.processor,
    transactionId: data.transactionId,
    amount: data.amount,
    currency: data.currency,
    durationDays: 30, // Monthly subscription
    isRecurring: true,
  });
};

/**
 * Handle subscription renewal
 */
const handleRenewal = async (data: any): Promise<void> => {
  await renewSubscription(
    data.originalTransactionId,
    data.newTransactionId,
    30 // 30 days
  );
};

/**
 * Handle subscription cancellation
 */
const handleCancellation = async (transactionId: string): Promise<void> => {
  const subscription = await prisma.subscription.findUnique({
    where: { transactionId },
  });

  if (!subscription) {
    console.error('Subscription not found:', transactionId);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      isRecurring: false,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'SUBSCRIPTION_CANCELLED_BY_PROCESSOR',
      entityType: 'Subscription',
      entityId: subscription.id,
      performedBy: 'SYSTEM',
      metadata: { transactionId },
    },
  });
};

/**
 * Handle chargeback
 */
const handleChargeback = async (transactionId: string): Promise<void> => {
  const subscription = await prisma.subscription.findUnique({
    where: { transactionId },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'CHARGEBACK' },
  });

  // Deduct from creator revenue
  await prisma.creator.update({
    where: { userId: subscription.creatorId },
    data: {
      revenue: {
        decrement: Number(subscription.amount) * 0.80,
      },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CHARGEBACK',
      entityType: 'Subscription',
      entityId: subscription.id,
      performedBy: 'SYSTEM',
      metadata: {
        transactionId,
        amount: subscription.amount,
      },
    },
  });
};

/**
 * Verify CCBill webhook signature
 */
const verifyCCBillSignature = (payload: any, signature: string): boolean => {
  // Implement according to CCBill documentation
  // This is a simplified example
  const secret = process.env.CCBILL_WEBHOOK_SECRET || '';
  const dataString = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('&');
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');

  return signature === expectedSignature;
};

/**
 * Verify Segpay webhook signature
 */
const verifySegpaySignature = (payload: any, authKey: string): boolean => {
  const secret = process.env.SEGPAY_AUTH_KEY || '';
  return authKey === secret;
};

/**
 * Verify Epoch webhook signature
 */
const verifyEpochSignature = (payload: any, hash: string): boolean => {
  const secret = process.env.EPOCH_HASH_KEY || '';
  const dataString = `${payload.pi_code}:${payload.ans}:${secret}`;
  
  const expectedHash = crypto
    .createHash('md5')
    .update(dataString)
    .digest('hex');

  return hash === expectedHash;
};
