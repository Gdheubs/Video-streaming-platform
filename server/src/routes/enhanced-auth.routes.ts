/**
 * Enhanced Auth Routes
 */

import express from 'express';
import {
  register,
  login,
  startAgeVerification,
  ageVerificationCallback,
  getCurrentUser,
} from '../controllers/auth.controller';
import {
  authenticate,
  createRateLimiter,
  sanitizeInput,
} from '../middlewares/security.middleware';

const router = express.Router();

// Public routes
router.post(
  '/register',
  sanitizeInput,
  createRateLimiter(5, 3600), // 5 registrations per hour
  register
);

router.post(
  '/login',
  sanitizeInput,
  createRateLimiter(10, 900), // 10 logins per 15 minutes
  login
);

// Age verification webhook
router.post('/age-verification/callback/:sessionId', ageVerificationCallback);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/age-verification/start', authenticate, startAgeVerification);

export default router;
