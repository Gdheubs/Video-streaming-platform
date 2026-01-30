/**
 * Enhanced Video Routes
 */

import express from 'express';
import {
  getUploadUrl,
  confirmUpload,
  getVideo,
  streamVideo,
  getTrendingVideos,
  searchVideos,
  likeVideo,
  deleteVideo,
} from '../controllers/enhanced-video.controller';
import {
  authenticate,
  optionalAuth,
  requireAgeVerification,
  requireCreator,
  createRateLimiter,
} from '../middlewares/security.middleware';

const router = express.Router();

// Public routes
router.get('/trending', getTrendingVideos);
router.get('/search', searchVideos);
router.get('/:id', optionalAuth, getVideo);

// Protected routes (requires auth + age verification)
router.get(
  '/:id/stream',
  authenticate,
  requireAgeVerification,
  createRateLimiter(100, 60), // 100 requests per minute
  streamVideo
);

router.post('/:id/like', authenticate, requireAgeVerification, likeVideo);

// Creator routes
router.post(
  '/upload/url',
  authenticate,
  requireCreator,
  createRateLimiter(10, 3600), // 10 uploads per hour
  getUploadUrl
);

router.post('/:id/confirm-upload', authenticate, requireCreator, confirmUpload);
router.delete('/:id', authenticate, requireCreator, deleteVideo);

export default router;
