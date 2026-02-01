import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { s3 } from "../lib/s3";

// Chunk size for streaming (1MB)
const STREAM_CHUNK_SIZE = 10 ** 6;

export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Use s3Key field or fallback to s3KeyOriginal for compatibility
    const s3Key = video.s3Key || video.s3KeyOriginal;

    if (!s3Key) {
      return res.status(404).json({ message: "Video file not found" });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET!,
      Key: s3Key,
    };

    const head = await s3.headObject(params).promise();
    const fileSize = head.ContentLength!;

    const range = req.headers.range;

    // Support both ranged and non-ranged requests
    if (!range) {
      // Non-ranged request - return full file info for metadata
      const stream = s3.getObject(params).createReadStream();
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });
      return stream.pipe(res);
    }

    // Parse Range header properly (e.g., "bytes=0-1023" or "bytes=0-")
    const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
    if (!rangeMatch) {
      return res.status(416).send("Invalid Range header");
    }

    const start = parseInt(rangeMatch[1], 10);
    const requestedEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;
    const end = requestedEnd !== undefined 
      ? Math.min(requestedEnd, fileSize - 1) 
      : Math.min(start + STREAM_CHUNK_SIZE, fileSize - 1);

    const stream = s3
      .getObject({
        ...params,
        Range: `bytes=${start}-${end}`,
      })
      .createReadStream();

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "video/mp4",
    });

    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Video streaming failed" });
  }
};
