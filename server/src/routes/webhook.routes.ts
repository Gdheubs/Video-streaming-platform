/**
 * Payment Webhook Routes
 */

import express from 'express';
import {
  handleCCBillWebhook,
  handleSegpayWebhook,
  handleEpochWebhook,
} from '../services/payment.service';

const router = express.Router();

// Payment processor webhooks (no auth - verified via signatures)
router.post('/webhooks/ccbill', handleCCBillWebhook);
router.post('/webhooks/segpay', handleSegpayWebhook);
router.post('/webhooks/epoch', handleEpochWebhook);

export default router;
