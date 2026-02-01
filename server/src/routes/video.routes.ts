import { Router } from "express";
import { streamVideo } from "../controllers/video.controller";

const router = Router();

router.get("/stream/:id", streamVideo);

export default router;
