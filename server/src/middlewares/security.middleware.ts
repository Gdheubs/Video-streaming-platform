/**
 * Security Middleware
 * CSRF protection, XSS prevention, rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit, isIpBlocked } from '../services/redis.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authenticate JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as any).user = { id: decoded.userId, role: decoded.role };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (req as any).user = { id: decoded.userId, role: decoded.role };
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Require age verification
 */
export const requireAgeVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAgeVerified: true },
    });

    if (!user?.isAgeVerified) {
      res.status(403).json({ error: 'Age verification required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Verification check failed' });
  }
};

/**
 * Require creator role
 */
export const requireCreator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (role !== 'CREATOR' && role !== 'ADMIN') {
      res.status(403).json({ error: 'Creator access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Require admin role
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = (req as any).user?.role;

    if (role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Rate limiting middleware
 */
export const createRateLimiter = (maxRequests: number, windowSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `${req.ip}:${req.path}`;
    const result = await rateLimit(key, maxRequests, windowSeconds);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);

    if (!result.allowed) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    next();
  };
};

/**
 * IP blocking middleware
 */
export const checkIpBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const blocked = await isIpBlocked(req.ip!);

  if (blocked) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  next();
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize string inputs to prevent XSS
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);

  next();
};

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
    
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  next();
};
