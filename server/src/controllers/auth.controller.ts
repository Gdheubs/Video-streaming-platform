/**
 * Auth Controller
 * Handles authentication, registration, and age verification
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initiateVerification, processVerificationCallback, markUserVerified } from '../services/age-verification.service';
import { rateLimit, trackFailedLogin, clearFailedLogin } from '../services/redis.service';

const prisma = new PrismaClient();

/**
 * Register new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    // Rate limiting
    const rateLimitResult = await rateLimit(`register:${req.ip}`, 5, 3600);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ error: 'Too many registration attempts' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        role: 'USER',
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isAgeVerified: user.isAgeVerified,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Rate limiting
    const rateLimitResult = await rateLimit(`login:${req.ip}`, 10, 900); // 10 per 15min
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ error: 'Too many login attempts' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        creatorProfile: {
          select: {
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      await trackFailedLogin(req.ip!);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await trackFailedLogin(req.ip!);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear failed attempts
    await clearFailedLogin(req.ip!);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isAgeVerified: user.isAgeVerified,
        isPremium: user.isPremium,
        creatorProfile: user.creatorProfile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Initiate age verification
 */
export const startAgeVerification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isAgeVerified) {
      return res.status(400).json({ error: 'Already age verified' });
    }

    // Initialize verification session
    const { sessionUrl, sessionId } = await initiateVerification(userId);

    res.json({
      verificationUrl: sessionUrl,
      sessionId,
    });
  } catch (error) {
    console.error('Age verification error:', error);
    res.status(500).json({ error: 'Failed to start age verification' });
  }
};

/**
 * Age verification callback (webhook from provider)
 */
export const ageVerificationCallback = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const payload = req.body;

    // Process verification result
    const result = await processVerificationCallback(sessionId, payload);

    if (result.success && result.isOver18) {
      // Extract user ID from vendorData
      const userId = payload.vendorData || payload.verification?.vendorData;
      
      if (userId) {
        await markUserVerified(userId, result.provider);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Age verification callback error:', error);
    res.status(500).send('Error');
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isAgeVerified: true,
        isPremium: true,
        avatar: true,
        bio: true,
        walletBalance: true,
        creatorProfile: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};
