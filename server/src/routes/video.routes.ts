import express from 'express';
import multer from 'multer';
import { authenticateToken, requireAgeVerification } from '../middlewares/auth.middleware';
import { uploadVideo, streamVideo } from '../controllers/video.controller';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticateToken, upload.single('video'), uploadVideo);
router.get('/:id/stream', authenticateToken, requireAgeVerification, streamVideo);

export default router;
