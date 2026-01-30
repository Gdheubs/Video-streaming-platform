/**
 * Subscription Management Service
 * Handles creator subscriptions with high-risk payment processors
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubscriptionData {
  subscriberId: string;
  creatorId: string;
  processor: 'ccbill' | 'segpay' | 'epoch';
  transactionId: string;
  amount: number;
  currency: string;
  durationDays: number;
  isRecurring: boolean;
}

/**
 * Create new subscription
 */
export const createSubscription = async (data: SubscriptionData): Promise<any> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.durationDays);

  const subscription = await prisma.subscription.create({
    data: {
      subscriberId: data.subscriberId,
      creatorId: data.creatorId,
      processor: data.processor.toUpperCase(),
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      status: 'ACTIVE',
      expiresAt,
      isRecurring: data.isRecurring,
    },
  });

  // Update subscriber's premium status
  await prisma.user.update({
    where: { id: data.subscriberId },
    data: { isPremium: true },
  });

  // Update creator's revenue
  const creatorCut = data.amount * 0.80; // 80% to creator, 20% platform fee
  await prisma.creator.update({
    where: { userId: data.creatorId },
    data: {
      revenue: {
        increment: creatorCut,
      },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'Subscription',
      entityId: subscription.id,
      performedBy: data.subscriberId,
      metadata: {
        creatorId: data.creatorId,
        amount: data.amount,
        processor: data.processor,
      },
    },
  });

  return subscription;
};

/**
 * Check if user has active subscription to creator
 */
export const hasActiveSubscription = async (
  subscriberId: string,
  creatorId: string
): Promise<boolean> => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      subscriberId,
      creatorId,
      status: 'ACTIVE',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return !!subscription;
};

/**
 * Get user's active subscriptions
 */
export const getUserSubscriptions = async (userId: string): Promise<any[]> => {
  return prisma.subscription.findMany({
    where: {
      subscriberId: userId,
      status: 'ACTIVE',
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          avatar: true,
          creatorProfile: {
            select: {
              bannerUrl: true,
              subscriptionPrice: true,
            },
          },
        },
      },
    },
    orderBy: { expiresAt: 'asc' },
  });
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  subscriptionId: string,
  userId: string
): Promise<void> => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription || subscription.subscriberId !== userId) {
    throw new Error('Subscription not found');
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      isRecurring: false,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'SUBSCRIPTION_CANCELLED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      performedBy: userId,
    },
  });
};

/**
 * Renew subscription (called by payment webhook)
 */
export const renewSubscription = async (
  transactionId: string,
  newTransactionId: string,
  durationDays: number
): Promise<void> => {
  const subscription = await prisma.subscription.findUnique({
    where: { transactionId },
  });

  if (!subscription) {
    throw new Error('Original subscription not found');
  }

  const newExpiresAt = new Date(subscription.expiresAt);
  newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      expiresAt: newExpiresAt,
      transactionId: newTransactionId,
      updatedAt: new Date(),
    },
  });

  // Update creator revenue
  const creatorCut = Number(subscription.amount) * 0.80;
  await prisma.creator.update({
    where: { userId: subscription.creatorId },
    data: {
      revenue: {
        increment: creatorCut,
      },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'SUBSCRIPTION_RENEWED',
      entityType: 'Subscription',
      entityId: subscription.id,
      performedBy: 'SYSTEM',
      metadata: {
        newTransactionId,
        newExpiresAt: newExpiresAt.toISOString(),
      },
    },
  });
};

/**
 * Expire old subscriptions (run as cron job)
 */
export const expireSubscriptions = async (): Promise<void> => {
  const expiredSubscriptions = await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  console.log(`Expired ${expiredSubscriptions.count} subscriptions`);
};

/**
 * Get creator's subscribers
 */
export const getCreatorSubscribers = async (creatorId: string): Promise<any[]> => {
  return prisma.subscription.findMany({
    where: {
      creatorId,
      status: 'ACTIVE',
    },
    include: {
      subscriber: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get subscription analytics for creator
 */
export const getSubscriptionAnalytics = async (creatorId: string): Promise<any> => {
  const [activeCount, totalRevenue, recentSubscriptions] = await Promise.all([
    prisma.subscription.count({
      where: {
        creatorId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.subscription.aggregate({
      where: { creatorId },
      _sum: { amount: true },
    }),
    prisma.subscription.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        subscriber: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    }),
  ]);

  return {
    activeSubscribers: activeCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    creatorRevenue: (Number(totalRevenue._sum.amount) || 0) * 0.80,
    recentSubscriptions,
  };
};
