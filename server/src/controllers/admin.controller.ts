/**
 * Admin Controller
 * Moderation queue, user management, analytics
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getPendingModerationQueue, approveVideo, rejectVideo } from '../services/moderation.service';
import { approveCreatorVerification, rejectCreatorVerification } from '../services/creator-verification.service';

const prisma = new PrismaClient();

/**
 * Get moderation queue
 */
export const getModerationQueue = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const videos = await getPendingModerationQueue(limit);

    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error('Moderation queue error:', error);
    res.status(500).json({ error: 'Failed to get moderation queue' });
  }
};

/**
 * Approve video (admin action)
 */
export const approveVideoModeration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    await approveVideo(id, adminId);

    res.json({ message: 'Video approved' });
  } catch (error) {
    console.error('Approve video error:', error);
    res.status(500).json({ error: 'Failed to approve video' });
  }
};

/**
 * Reject video (admin action)
 */
export const rejectVideoModeration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    await rejectVideo(id, adminId, reason);

    res.json({ message: 'Video rejected' });
  } catch (error) {
    console.error('Reject video error:', error);
    res.status(500).json({ error: 'Failed to reject video' });
  }
};

/**
 * Get pending creator verifications
 */
export const getPendingCreators = async (req: Request, res: Response) => {
  try {
    const creators = await prisma.creator.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
          },
        },
      },
      orderBy: { userId: 'asc' },
    });

    res.json({ creators, count: creators.length });
  } catch (error) {
    console.error('Pending creators error:', error);
    res.status(500).json({ error: 'Failed to get pending creators' });
  }
};

/**
 * Approve creator verification
 */
export const approveCreator = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.id;

    await approveCreatorVerification(userId, adminId);

    res.json({ message: 'Creator approved' });
  } catch (error) {
    console.error('Approve creator error:', error);
    res.status(500).json({ error: 'Failed to approve creator' });
  }
};

/**
 * Reject creator verification
 */
export const rejectCreator = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    await rejectCreatorVerification(userId, adminId, reason);

    res.json({ message: 'Creator rejected' });
  } catch (error) {
    console.error('Reject creator error:', error);
    res.status(500).json({ error: 'Failed to reject creator' });
  }
};

/**
 * Get platform analytics
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      verifiedCreators,
      totalVideos,
      pendingModeration,
      totalRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.creator.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.video.count({ where: { status: 'READY' } }),
      prisma.video.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.subscription.aggregate({
        _sum: { amount: true },
      }),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    res.json({
      totalUsers,
      verifiedCreators,
      totalVideos,
      pendingModeration,
      totalRevenue: totalRevenue._sum.amount || 0,
      platformRevenue: (Number(totalRevenue._sum.amount) || 0) * 0.20,
      activeSubscriptions,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

/**
 * Get audit logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, entityType, action } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

/**
 * Ban user
 */
export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'GUEST' },
    });

    // Delete all videos
    await prisma.video.updateMany({
      where: { creatorId: userId },
      data: { status: 'FAILED', moderationStatus: 'REJECTED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_BANNED',
        entityType: 'User',
        entityId: userId,
        performedBy: adminId,
        metadata: { reason },
      },
    });

    res.json({ message: 'User banned' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};
