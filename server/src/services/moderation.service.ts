/**
 * Content Moderation Service
 * AI-powered scanning using AWS Rekognition + Manual review queue
 * CRITICAL: Detects illegal content (CSAM) and enforces content policies
 */

import { RekognitionClient, StartContentModerationCommand, GetContentModerationCommand } from '@aws-sdk/client-rekognition';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION });

interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: string[];
  requiresHumanReview: boolean;
}

/**
 * Scan video with AWS Rekognition
 */
export const scanVideoContent = async (videoId: string, s3Key: string): Promise<ModerationResult> => {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new Error('Video not found');

  try {
    // Start AWS Rekognition job
    const startCommand = new StartContentModerationCommand({
      Video: {
        S3Object: {
          Bucket: process.env.AWS_S3_PUBLIC_BUCKET,
          Name: s3Key,
        },
      },
      MinConfidence: 60,
    });

    const { JobId } = await rekognitionClient.send(startCommand);

    // Poll for results (in production, use SNS webhook)
    await waitForModerationJob(JobId!);

    // Get results
    const getCommand = new GetContentModerationCommand({ JobId });
    const results = await rekognitionClient.send(getCommand);

    // Analyze results
    const flags: string[] = [];
    let maxConfidence = 0;

    results.ModerationLabels?.forEach((label) => {
      if (label.ModerationLabel && label.ModerationLabel.Confidence! > maxConfidence) {
        maxConfidence = label.ModerationLabel.Confidence!;
      }

      const labelName = label.ModerationLabel?.Name || '';
      
      // CRITICAL: Auto-reject illegal content
      if (labelName.includes('Child') || labelName.includes('Minor')) {
        flags.push('ILLEGAL_CONTENT');
      } else if (labelName.includes('Explicit Nudity')) {
        flags.push('EXPLICIT_ADULT');
      } else if (labelName.includes('Violence')) {
        flags.push('VIOLENCE');
      }
    });

    const isApproved = !flags.includes('ILLEGAL_CONTENT');
    const requiresHumanReview = flags.length > 0 && isApproved;

    // Save results
    await prisma.video.update({
      where: { id: videoId },
      data: {
        aiScanResult: results as any,
        aiConfidenceScore: maxConfidence,
        moderationStatus: isApproved ? (requiresHumanReview ? 'PENDING' : 'APPROVED') : 'REJECTED',
      },
    });

    // Auto-ban if illegal content detected
    if (flags.includes('ILLEGAL_CONTENT')) {
      await handleIllegalContent(videoId, video.creatorId);
    }

    return { isApproved, confidence: maxConfidence, flags, requiresHumanReview };

  } catch (error) {
    console.error('Moderation scan failed:', error);
    
    // On error, default to pending human review
    await prisma.video.update({
      where: { id: videoId },
      data: { moderationStatus: 'PENDING' },
    });

    return { isApproved: false, confidence: 0, flags: ['ERROR'], requiresHumanReview: true };
  }
};

/**
 * Scan with Sightengine (alternative/additional to AWS Rekognition)
 */
export const scanWithSightengine = async (videoUrl: string): Promise<any> => {
  if (!process.env.SIGHTENGINE_API_USER || !process.env.SIGHTENGINE_API_SECRET) {
    console.warn('Sightengine credentials not configured');
    return null;
  }

  try {
    const response = await axios.get('https://api.sightengine.com/1.0/video/check.json', {
      params: {
        url: videoUrl,
        models: 'nudity-2.0,wad,offensive,Gore',
        api_user: process.env.SIGHTENGINE_API_USER,
        api_secret: process.env.SIGHTENGINE_API_SECRET,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Sightengine scan failed:', error);
    return null;
  }
};

/**
 * Wait for Rekognition job to complete
 */
const waitForModerationJob = async (jobId: string, maxAttempts = 60): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    const command = new GetContentModerationCommand({ JobId: jobId });
    const result = await rekognitionClient.send(command);

    if (result.JobStatus === 'SUCCEEDED') return;
    if (result.JobStatus === 'FAILED') throw new Error('Moderation job failed');

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
  }

  throw new Error('Moderation job timeout');
};

/**
 * Handle illegal content detection
 */
const handleIllegalContent = async (videoId: string, creatorId: string): Promise<void> => {
  // 1. Immediately ban the video
  await prisma.video.update({
    where: { id: videoId },
    data: { 
      moderationStatus: 'REJECTED',
      status: 'FAILED', // Prevent it from being accessible
    },
  });

  // 2. Ban the creator
  await prisma.user.update({
    where: { id: creatorId },
    data: { role: 'GUEST' }, // Revoke creator privileges
  });

  // 3. Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'ILLEGAL_CONTENT_DETECTED',
      entityType: 'Video',
      entityId: videoId,
      performedBy: 'SYSTEM',
      metadata: {
        creatorId,
        action: 'AUTO_BANNED',
        severity: 'CRITICAL',
      },
    },
  });

  // 4. Alert admins (email, Slack, etc.)
  await alertAdmins({
    type: 'ILLEGAL_CONTENT',
    videoId,
    creatorId,
    timestamp: new Date().toISOString(),
  });

  // 5. Optional: Report to NCMEC (National Center for Missing & Exploited Children) if CSAM
  // This is a LEGAL REQUIREMENT in the US
  // await reportToNCMEC({ videoId, creatorId });
};

/**
 * Manual moderation approval (Admin action)
 */
export const approveVideo = async (videoId: string, adminId: string): Promise<void> => {
  await prisma.video.update({
    where: { id: videoId },
    data: {
      moderationStatus: 'APPROVED',
      publishedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'VIDEO_APPROVED',
      entityType: 'Video',
      entityId: videoId,
      performedBy: adminId,
    },
  });
};

/**
 * Manual moderation rejection (Admin action)
 */
export const rejectVideo = async (videoId: string, adminId: string, reason: string): Promise<void> => {
  await prisma.video.update({
    where: { id: videoId },
    data: {
      moderationStatus: 'REJECTED',
      status: 'FAILED',
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'VIDEO_REJECTED',
      entityType: 'Video',
      entityId: videoId,
      performedBy: adminId,
      metadata: { reason },
    },
  });
};

/**
 * Get videos pending moderation
 */
export const getPendingModerationQueue = async (limit = 50): Promise<any[]> => {
  return prisma.video.findMany({
    where: { moderationStatus: 'PENDING' },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          username: true,
          creatorProfile: {
            select: { verificationStatus: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
};

/**
 * Alert admins about critical issues
 */
const alertAdmins = async (alert: any): Promise<void> => {
  // Implement Slack webhook, email, or SMS notification
  console.error('CRITICAL ALERT:', alert);
  
  // Example: Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `🚨 CRITICAL: ${alert.type} detected`,
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Video ID', value: alert.videoId, short: true },
            { title: 'Creator ID', value: alert.creatorId, short: true },
            { title: 'Timestamp', value: alert.timestamp, short: false },
          ],
        },
      ],
    });
  }
};
