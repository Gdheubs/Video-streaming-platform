/**
 * Admin Routes
 */

import express from 'express';
import {
  getModerationQueue,
  approveVideoModeration,
  rejectVideoModeration,
  getPendingCreators,
  approveCreator,
  rejectCreator,
  getAnalytics,
  getAuditLogs,
  banUser,
} from '../controllers/admin.controller';
import {
  authenticate,
  requireAdmin,
} from '../middlewares/security.middleware';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Moderation
router.get('/moderation/queue', getModerationQueue);
router.post('/moderation/videos/:id/approve', approveVideoModeration);
router.post('/moderation/videos/:id/reject', rejectVideoModeration);

// Creator verification
router.get('/creators/pending', getPendingCreators);
router.post('/creators/:userId/approve', approveCreator);
router.post('/creators/:userId/reject', rejectCreator);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

// User management
router.post('/users/:userId/ban', banUser);

export default router;
