/**
 * CloudFront Signed URLs/Cookies Service
 * Prevents unauthorized access to premium content
 * CRITICAL: Without this, users can share direct video URLs
 */

import { getSignedCookies, getSignedUrl } from "@aws-sdk/cloudfront-signer";
import fs from 'fs';
import path from 'path';

// Note: Ensure you place your private_key.pem in the server root
const privateKeyPath = path.join(process.cwd(), 'private_key.pem'); 
const KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!; 

/**
 * Generate CloudFront signed cookies for premium content
 * Used for HLS streaming (protects .m3u8 and .ts files)
 */
export const generateSignedCookies = (resourcePath: string, expirationHours = 6) => {
  try {
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
    
    // Policy: Configurable expiration
    const dateLessThan = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

    const cookies = getSignedCookies({
      url: `${CLOUDFRONT_DOMAIN}/${resourcePath}`,
      keyPairId: KEY_PAIR_ID,
      privateKey,
      dateLessThan,
    });

    return cookies;
  } catch (error) {
    console.error("Error signing cookies:", error);
    return null;
  }
};

/**
 * Generate CloudFront signed URL for direct file access
 * Used for thumbnail images, previews, etc.
 */
export const generateCloudFrontSignedUrl = (url: string, expirationHours = 1) => {
  try {
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
    const dateLessThan = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

    const signedUrl = getSignedUrl({
      url,
      keyPairId: KEY_PAIR_ID,
      privateKey,
      dateLessThan,
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

/**
 * Validate if user has access to premium content
 */
export const validatePremiumAccess = async (
  userId: string,
  videoId: string,
  prisma: any
): Promise<boolean> => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      visibility: true,
      creatorId: true,
    },
  });

  if (!video) return false;

  // Public videos are always accessible
  if (video.visibility === 'PUBLIC') return true;

  // Creator can always access their own videos
  if (video.creatorId === userId) return true;

  // Check if user has active subscription
  if (video.visibility === 'PREMIUM') {
    const subscription = await prisma.subscription.findFirst({
      where: {
        subscriberId: userId,
        creatorId: video.creatorId,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return !!subscription;
  }

  // Private videos only accessible by creator
  return false;
};

/**
 * Set CloudFront cookies on response
 */
export const setCloudfrontCookies = (
  res: any,
  cookies: any
): void => {
  if (!cookies) return;
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  };

  Object.entries(cookies).forEach(([name, value]) => {
    res.cookie(name, value as string, cookieOptions);
  });
};

