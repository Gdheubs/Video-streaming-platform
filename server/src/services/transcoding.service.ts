/**
 * Video Transcoding Service
 * Handles HLS (HTTP Live Streaming) conversion with multiple quality levels
 * Uses BullMQ for job queue management
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface TranscodeOptions {
  videoId: string;
  s3Key: string;
  qualities: VideoQuality[];
}

interface VideoQuality {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

const QUALITY_PRESETS: VideoQuality[] = [
  { name: '1080p', width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k' },
  { name: '720p', width: 1280, height: 720, videoBitrate: '2800k', audioBitrate: '128k' },
  { name: '480p', width: 854, height: 480, videoBitrate: '1400k', audioBitrate: '128k' },
  { name: '360p', width: 640, height: 360, videoBitrate: '800k', audioBitrate: '96k' },
];

/**
 * Generate presigned URL for direct S3 upload
 */
export const generatePresignedUploadUrl = async (
  userId: string,
  filename: string
): Promise<{ uploadUrl: string; s3Key: string }> => {
  const s3Key = `uploads/originals/${userId}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_INGEST_BUCKET,
    Key: s3Key,
    ContentType: 'video/mp4',
    Metadata: {
      'uploaded-by': userId,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  return { uploadUrl, s3Key };
};

/**
 * Start video transcoding job
 * This should be called by a webhook after S3 upload completes
 */
export const startTranscodingJob = async (
  videoId: string,
  s3Key: string
): Promise<void> => {
  // Update video status
  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'PROCESSING', s3KeyOriginal: s3Key },
  });

  // In production, add to BullMQ queue
  // await transcodingQueue.add('transcode', { videoId, s3Key });

  // For now, process directly (in production, this runs in a worker)
  await transcodeVideo({ videoId, s3Key, qualities: QUALITY_PRESETS });
};

/**
 * Transcode video to HLS format with multiple quality levels
 */
const transcodeVideo = async (options: TranscodeOptions): Promise<void> => {
  const { videoId, s3Key } = options;
  const tempDir = `/tmp/transcode-${videoId}`;
  const outputDir = `${tempDir}/output`;

  try {
    // Create temp directories
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    // 1. Download original from S3
    const localFile = `${tempDir}/original.mp4`;
    await downloadFromS3(s3Key, localFile);

    // 2. Generate thumbnail
    const thumbnailPath = await generateThumbnail(localFile, tempDir);

    // 3. Generate sprite sheet for scrubbing preview
    const spritePath = await generateSpriteSheet(localFile, tempDir);

    // 4. Get video metadata
    const metadata = await getVideoMetadata(localFile);

    // 5. Transcode to HLS with multiple qualities
    const manifestPath = await transcodeToHLS(localFile, outputDir, options.qualities);

    // 6. Upload all generated files to S3
    const hlsKey = await uploadHLSToS3(videoId, outputDir);
    const thumbnailUrl = await uploadFileToS3(thumbnailPath, `thumbnails/${videoId}.jpg`);
    const spriteUrl = await uploadFileToS3(spritePath, `sprites/${videoId}.jpg`);

    // 7. Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'READY',
        s3KeyHLS: hlsKey,
        hlsManifestUrl: `${process.env.CLOUDFRONT_DOMAIN}/${hlsKey}`,
        thumbnailUrl,
        spritesheetUrl: spriteUrl,
        durationSeconds: Math.floor(metadata.duration),
      },
    });

    // 8. Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });

    // 9. Trigger AI moderation scan
    await triggerModerationScan(videoId);

  } catch (error) {
    console.error(`Transcoding failed for video ${videoId}:`, error);
    
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'FAILED' },
    });

    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    throw error;
  }
};

/**
 * Transcode to HLS with adaptive bitrate
 */
const transcodeToHLS = (
  inputPath: string,
  outputDir: string,
  qualities: VideoQuality[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const manifestPath = path.join(outputDir, 'master.m3u8');

    // Generate variant playlists
    const variantPromises = qualities.map((quality) => {
      return new Promise<void>((res, rej) => {
        const variantDir = path.join(outputDir, quality.name);
        fs.mkdirSync(variantDir, { recursive: true });

        ffmpeg(inputPath)
          .size(`${quality.width}x${quality.height}`)
          .videoBitrate(quality.videoBitrate)
          .audioBitrate(quality.audioBitrate)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-profile:v baseline',
            '-level 3.0',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
          ])
          .output(path.join(variantDir, 'index.m3u8'))
          .on('end', () => res())
          .on('error', (err) => rej(err))
          .run();
      });
    });

    Promise.all(variantPromises)
      .then(() => {
        // Create master playlist
        const masterPlaylist = generateMasterPlaylist(qualities);
        fs.writeFileSync(manifestPath, masterPlaylist);
        resolve(manifestPath);
      })
      .catch(reject);
  });
};

/**
 * Generate master HLS playlist
 */
const generateMasterPlaylist = (qualities: VideoQuality[]): string => {
  let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n';

  qualities.forEach((quality) => {
    const bandwidth = parseInt(quality.videoBitrate.replace('k', '000'));
    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height}\n`;
    playlist += `${quality.name}/index.m3u8\n`;
  });

  return playlist;
};

/**
 * Generate video thumbnail
 */
const generateThumbnail = (inputPath: string, outputDir: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');

    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['10%'],
        filename: 'thumbnail.jpg',
        folder: outputDir,
        size: '1280x720',
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', reject);
  });
};

/**
 * Generate sprite sheet for video scrubbing preview
 */
const generateSpriteSheet = (inputPath: string, outputDir: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spritePath = path.join(outputDir, 'sprite.jpg');

    ffmpeg(inputPath)
      .outputOptions([
        '-vf fps=1/10,scale=160:90,tile=10x10', // 10x10 grid, 1 frame per 10 seconds
      ])
      .output(spritePath)
      .on('end', () => resolve(spritePath))
      .on('error', reject)
      .run();
  });
};

/**
 * Get video metadata
 */
const getVideoMetadata = (inputPath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format);
    });
  });
};

/**
 * Download file from S3
 */
const downloadFromS3 = async (s3Key: string, localPath: string): Promise<void> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_INGEST_BUCKET,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as any;

  const writeStream = fs.createWriteStream(localPath);
  stream.pipe(writeStream);

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};

/**
 * Upload HLS directory to S3
 */
const uploadHLSToS3 = async (videoId: string, outputDir: string): Promise<string> => {
  const baseKey = `videos/${videoId}`;

  const uploadFile = async (filePath: string): Promise<void> => {
    const relativePath = path.relative(outputDir, filePath);
    const s3Key = `${baseKey}/${relativePath}`;

    const fileContent = fs.readFileSync(filePath);
    const contentType = filePath.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_PUBLIC_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    });

    await s3Client.send(command);
  };

  // Recursively upload all files
  const uploadDirectory = async (dir: string): Promise<void> => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await uploadDirectory(fullPath);
      } else {
        await uploadFile(fullPath);
      }
    }
  };

  await uploadDirectory(outputDir);
  return `${baseKey}/master.m3u8`;
};

/**
 * Upload single file to S3
 */
const uploadFileToS3 = async (localPath: string, s3Key: string): Promise<string> => {
  const fileContent = fs.readFileSync(localPath);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_PUBLIC_BUCKET,
    Key: s3Key,
    Body: fileContent,
    ContentType: s3Key.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream',
  });

  await s3Client.send(command);
  return `${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`;
};

/**
 * Trigger AI moderation scan
 */
const triggerModerationScan = async (videoId: string): Promise<void> => {
  // This would integrate with AWS Rekognition or Sightengine
  // For now, just update status to pending review
  await prisma.video.update({
    where: { id: videoId },
    data: { moderationStatus: 'PENDING' },
  });
};
