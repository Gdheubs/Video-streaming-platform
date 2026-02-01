import { Router } from "express";
import { streamVideo } from "../controllers/video.controller";

const router = Router();

// Basic streaming endpoint - add authentication middleware if needed
// Example with auth: router.get("/stream/:id", authenticateToken, streamVideo);
router.get("/stream/:id", streamVideo);

export default router;
