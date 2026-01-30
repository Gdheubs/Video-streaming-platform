/**
 * Enhanced Video Controller
 * Handles video upload, streaming, and management
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generatePresignedUploadUrl, startTranscodingJob } from '../services/transcoding.service';
import { generateSignedCookies, validatePremiumAccess, setCloudfrontCookies } from '../services/cloudfront.service';
import { scanVideoContent } from '../services/moderation.service';
import { cacheVideo, getCachedVideo, incrementViewCount } from '../services/redis.service';

const prisma = new PrismaClient();

/**
 * Get presigned URL for direct S3 upload
 */
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { filename, title, description, visibility = 'PUBLIC' } = req.body;

    // Verify user is a verified creator
    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator || creator.verificationStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'Creator verification required' });
    }

    // Generate presigned upload URL
    const { uploadUrl, s3Key } = await generatePresignedUploadUrl(userId, filename);

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description,
        visibility,
        creatorId: userId,
        s3KeyOriginal: s3Key,
        status: 'PROCESSING',
        moderationStatus: 'PENDING',
      },
    });

    res.json({
      uploadUrl,
      videoId: video.id,
      s3Key,
    });
  } catch (error) {
    console.error('Upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

/**
 * Confirm upload complete and start transcoding
 */
export const confirmUpload = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = (req as any).user.id;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.creatorId !== userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Start transcoding job
    await startTranscodingJob(videoId, video.s3KeyOriginal!);

    res.json({ message: 'Transcoding started', videoId });
  } catch (error) {
    console.error('Confirm upload error:', error);
    res.status(500).json({ error: 'Failed to start transcoding' });
  }
};

/**
 * Get video details
 */
export const getVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    // Check cache first
    let video = await getCachedVideo(id);

    if (!video) {
      video = await prisma.video.findUnique({
        where: { id },
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
      });

      if (video) {
        await cacheVideo(id, video);
      }
    }

    if (!video || video.moderationStatus !== 'APPROVED') {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check access for premium content
    if (video.visibility === 'PREMIUM' && userId) {
      const hasAccess = await validatePremiumAccess(userId, id, prisma);
      video.hasAccess = hasAccess;
    } else {
      video.hasAccess = video.visibility === 'PUBLIC';
    }

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
};

/**
 * Stream video (with access control)
 */
export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        hlsManifestUrl: true,
        s3KeyHLS: true,
        visibility: true,
        creatorId: true,
        status: true,
        moderationStatus: true,
      },
    });

    if (!video || video.status !== 'READY' || video.moderationStatus !== 'APPROVED') {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Validate access
    const hasAccess = await validatePremiumAccess(userId, id, prisma);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }

    // Generate signed cookies for HLS streaming
    const cookies = generateSignedCookies(`videos/${id}/*`);

    if (cookies) {
      setCloudfrontCookies(res, cookies);
    }

    // Increment view count
    await incrementViewCount(id);

    // Track view in database (async)
    prisma.view.create({
      data: {
        videoId: id,
        userId: userId || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    }).catch(console.error);

    res.json({
      url: video.hlsManifestUrl,
      videoId: id,
    });
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
};

/**
 * Get trending videos
 */
export const getTrendingVideos = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const videos = await prisma.video.findMany({
      where: {
        status: 'READY',
        moderationStatus: 'APPROVED',
        visibility: 'PUBLIC',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    res.json(videos);
  } catch (error) {
    console.error('Trending videos error:', error);
    res.status(500).json({ error: 'Failed to get trending videos' });
  }
};

/**
 * Search videos
 */
export const searchVideos = async (req: Request, res: Response) => {
  try {
    const { q, category, tags, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      status: 'READY',
      moderationStatus: 'APPROVED',
      visibility: 'PUBLIC',
    };

    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tags) {
      where.tags = {
        hasSome: (tags as string).split(','),
      };
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.video.count({ where }),
    ]);

    res.json({
      videos,
      total,
      page: parseInt(page as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
};

/**
 * Like video
 */
export const likeVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    await prisma.like.create({
      data: {
        userId,
        videoId: id,
      },
    });

    await prisma.video.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    res.json({ message: 'Video liked' });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(400).json({ error: 'Already liked or error occurred' });
  }
};

/**
 * Delete video (Creator only)
 */
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video || video.creatorId !== userId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await prisma.video.delete({
      where: { id },
    });

    res.json({ message: 'Video deleted' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};
