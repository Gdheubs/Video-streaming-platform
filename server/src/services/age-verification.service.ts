/**
 * Age Verification Service
 * Integrates with third-party AV providers (Veriff, Yoti, etc.)
 * CRITICAL: Never store raw government IDs unless necessary for Creator 2257 compliance
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  success: boolean;
  provider: string;
  sessionId: string;
  isOver18: boolean;
  metadata?: any;
}

/**
 * Initialize age verification session with provider
 */
export const initiateVerification = async (userId: string): Promise<{ sessionUrl: string; sessionId: string }> => {
  // Example: Veriff API integration
  const provider = process.env.AGE_VERIFICATION_PROVIDER || 'veriff';
  
  if (provider === 'veriff') {
    try {
      const response = await axios.post(
        'https://stationapi.veriff.com/v1/sessions',
        {
          verification: {
            callback: `${process.env.API_URL}/api/auth/age-verification/callback`,
            person: {
              // Don't send PII unless required
            },
            vendorData: userId, // Pass user ID for callback matching
          },
        },
        {
          headers: {
            'X-AUTH-CLIENT': process.env.VERIFF_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        sessionUrl: response.data.verification.url,
        sessionId: response.data.verification.id,
      };
    } catch (error) {
      console.error('Veriff API error:', error);
      throw new Error('Age verification service unavailable');
    }
  }

  // Fallback: Mock verification for development
  if (process.env.NODE_ENV === 'development') {
    return {
      sessionUrl: `${process.env.CLIENT_URL}/verify-age/mock`,
      sessionId: `mock-${Date.now()}`,
    };
  }

  throw new Error('No age verification provider configured');
};

/**
 * Process verification callback from provider
 */
export const processVerificationCallback = async (
  sessionId: string,
  payload: any
): Promise<VerificationResult> => {
  const provider = process.env.AGE_VERIFICATION_PROVIDER || 'veriff';

  if (provider === 'veriff') {
    // Verify webhook signature (CRITICAL for security)
    const isValidSignature = verifyWebhookSignature(payload);
    if (!isValidSignature) {
      throw new Error('Invalid webhook signature');
    }

    const isOver18 = payload.verification?.person?.dateOfBirth
      ? calculateAge(payload.verification.person.dateOfBirth) >= 18
      : false;

    return {
      success: payload.verification?.status === 'approved',
      provider: 'veriff',
      sessionId,
      isOver18,
      metadata: {
        verificationTime: payload.verification?.acceptanceTime,
      },
    };
  }

  // Mock verification for development
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      provider: 'mock',
      sessionId,
      isOver18: true,
    };
  }

  throw new Error('Unknown provider');
};

/**
 * Mark user as age verified
 */
export const markUserVerified = async (userId: string, provider: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isAgeVerified: true,
      ageVerificationProvider: provider,
      ageVerifiedAt: new Date(),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'AGE_VERIFIED',
      entityType: 'User',
      entityId: userId,
      performedBy: 'SYSTEM',
      metadata: { provider },
    },
  });
};

/**
 * Verify webhook signature (Example for Veriff)
 */
const verifyWebhookSignature = (payload: any): boolean => {
  // Implement HMAC signature verification
  // This is a placeholder - implement according to provider's documentation
  const signature = payload.signature || '';
  const secret = process.env.VERIFF_WEBHOOK_SECRET || '';
  
  // In production, use crypto.createHmac to verify
  return true; // Placeholder
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const ageDiff = Date.now() - dob.getTime();
  const ageDate = new Date(ageDiff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/**
 * Check if user's verification is still valid
 */
export const isVerificationValid = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAgeVerified: true, ageVerifiedAt: true },
  });

  if (!user?.isAgeVerified) return false;

  // Optional: Require re-verification after certain period (e.g., 1 year)
  const verificationAge = user.ageVerifiedAt
    ? Date.now() - user.ageVerifiedAt.getTime()
    : 0;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  return verificationAge < oneYearMs;
};
