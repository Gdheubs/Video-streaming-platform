import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import videoRoutes from "./routes/video.routes";

// Routes
import authRoutes from "./routes/enhanced-auth.routes";
import enhancedVideoRoutes from "./routes/enhanced-video.routes";
import adminRoutes from "./routes/admin.routes";
import webhookRoutes from "./routes/webhook.routes";

// Middleware
import {
  securityHeaders,
  checkIpBlock,
  sanitizeInput,
} from "./middlewares/security.middleware";

dotenv.config();

const app = express();

/* ENV VALIDATION */
[
  "DATABASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_BUCKET",
].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️ Missing env variable: ${k}`);
  }
});

// Security middleware (before body parser for webhooks)
app.use(helmet());
app.use(securityHeaders);
app.use(checkIpBlock);

/* MIDDLEWARE */
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Range", "Accept-Ranges"],
  })
);

// Body parsing
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization
app.use(sanitizeInput);

/* ROUTES */
app.use("/videos", videoRoutes);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", enhancedVideoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", webhookRoutes);

/* HEALTH CHECK */
app.get("/health", (_, res) => res.send("OK"));

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
