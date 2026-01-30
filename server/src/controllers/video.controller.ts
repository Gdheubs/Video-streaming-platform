import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateSignedCookies } from '../services/cloudfront.service';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

const prisma = new PrismaClient();

// 1. Upload & Transcode (Simplistic Local Version)
export const uploadVideo = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).send("No file");
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  
  // Create DB Entry
  const video = await prisma.video.create({
    data: {
      title: req.body.title || "Untitled",
      url: "", 
      creatorId: req.user.id
    }
  });

  // Start FFmpeg HLS Transcoding (Background)
  const outputDir = `public/videos/${video.id}`;
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  ffmpeg(req.file.path)
    .outputOptions([
      '-profile:v baseline',
      '-level 3.0',
      '-hls_time 10',
      '-hls_list_size 0',
      '-f hls'
    ])
    .output(`${outputDir}/index.m3u8`)
    .on('end', async () => {
      await prisma.video.update({
        where: { id: video.id },
        data: { 
          status: 'READY',
          url: `/videos/${video.id}/index.m3u8` // In prod, this is the S3 key
        }
      });
    })
    .run();

  res.json({ message: "Processing started", videoId: video.id });
};

// 2. Stream Securely (Generate Cookies)
export const streamVideo = async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  
  if (!video) return res.status(404).json({ error: "Not Found" });

  // Generate Cookies for CloudFront
  const cookies = generateSignedCookies(`videos/${videoId}/*`);

  if (cookies) {
    const opts = { httpOnly: true, secure: true, sameSite: 'none' as const };
    res.cookie('CloudFront-Policy', cookies['CloudFront-Policy'], opts);
    res.cookie('CloudFront-Signature', cookies['CloudFront-Signature'], opts);
    res.cookie('CloudFront-Key-Pair-Id', cookies['CloudFront-Key-Pair-Id'], opts);
  }

  res.json({ url: `${process.env.CLOUDFRONT_DOMAIN}/${video.url}` });
};
