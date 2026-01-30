/**
 * Redis Service for Caching and Rate Limiting
 * Critical for high-traffic adult content platforms
 */

import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

/**
 * Rate limiting middleware
 * Prevents brute force attacks and abuse
 */
export const rateLimit = async (
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  const count = await redis.incr(windowKey);
  
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  const allowed = count <= maxRequests;
  const resetTime = Math.floor(now / (windowSeconds * 1000) + 1) * windowSeconds * 1000;

  return {
    allowed,
    remaining: Math.max(0, maxRequests - count),
    resetTime,
  };
};

/**
 * Cache video metadata
 */
export const cacheVideo = async (videoId: string, data: any, ttl = 3600): Promise<void> => {
  await redis.setex(`video:${videoId}`, ttl, JSON.stringify(data));
};

/**
 * Get cached video
 */
export const getCachedVideo = async (videoId: string): Promise<any | null> => {
  const data = await redis.get(`video:${videoId}`);
  return data ? JSON.parse(data) : null;
};

/**
 * Cache trending videos
 */
export const cacheTrendingVideos = async (videos: any[], ttl = 300): Promise<void> => {
  await redis.setex('trending:videos', ttl, JSON.stringify(videos));
};

/**
 * Get cached trending videos
 */
export const getCachedTrendingVideos = async (): Promise<any[] | null> => {
  const data = await redis.get('trending:videos');
  return data ? JSON.parse(data) : null;
};

/**
 * Increment view count (atomic operation)
 */
export const incrementViewCount = async (videoId: string): Promise<number> => {
  return await redis.incr(`views:${videoId}`);
};

/**
 * Get view count from cache
 */
export const getViewCount = async (videoId: string): Promise<number> => {
  const count = await redis.get(`views:${videoId}`);
  return count ? parseInt(count) : 0;
};

/**
 * Cache user session
 */
export const cacheSession = async (
  sessionId: string,
  userId: string,
  ttl = 604800 // 7 days
): Promise<void> => {
  await redis.setex(`session:${sessionId}`, ttl, userId);
};

/**
 * Get cached session
 */
export const getCachedSession = async (sessionId: string): Promise<string | null> => {
  return await redis.get(`session:${sessionId}`);
};

/**
 * Delete session
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await redis.del(`session:${sessionId}`);
};

/**
 * Add video to trending sorted set
 */
export const addToTrending = async (videoId: string, score: number): Promise<void> => {
  await redis.zadd('trending', score, videoId);
};

/**
 * Get trending video IDs
 */
export const getTrendingVideoIds = async (limit = 50): Promise<string[]> => {
  return await redis.zrevrange('trending', 0, limit - 1);
};

/**
 * Check if IP is blocked
 */
export const isIpBlocked = async (ip: string): Promise<boolean> => {
  const blocked = await redis.get(`blocked:ip:${ip}`);
  return blocked === '1';
};

/**
 * Block IP address
 */
export const blockIp = async (ip: string, durationSeconds = 86400): Promise<void> => {
  await redis.setex(`blocked:ip:${ip}`, durationSeconds, '1');
};

/**
 * Track failed login attempts
 */
export const trackFailedLogin = async (identifier: string): Promise<number> => {
  const key = `failed_login:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 900); // 15 minutes
  }

  // Auto-block after 5 failed attempts
  if (count >= 5) {
    await blockIp(identifier, 3600); // 1 hour
  }

  return count;
};

/**
 * Clear failed login attempts
 */
export const clearFailedLogin = async (identifier: string): Promise<void> => {
  await redis.del(`failed_login:${identifier}`);
};

export default redis;
