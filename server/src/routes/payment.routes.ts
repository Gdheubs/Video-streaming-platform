import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Webhook handler for payment processors
router.post('/webhook', async (req, res) => {
  try {
    const { transactionId, userId, amount, currency, processor } = req.body;
    
    // Verify webhook signature here (implementation depends on payment processor)
    
    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        processor,
        transactionId,
        amount,
        currency,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'ACTIVE'
      }
    });
    
    // Update user premium status
    await prisma.user.update({
      where: { id: userId },
      data: { isPremium: true }
    });
    
    res.json({ success: true, subscriptionId: subscription.id });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Get user subscriptions
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: (req as any).user.id }
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch subscriptions' });
  }
});

export default router;
