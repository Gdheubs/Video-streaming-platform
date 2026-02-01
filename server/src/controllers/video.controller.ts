import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { s3 } from "../lib/s3";

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
    const s3Key = (video as any).s3Key || video.s3KeyOriginal;

    if (!s3Key) {
      return res.status(404).json({ message: "Video file not found" });
    }

    const range = req.headers.range;
    if (!range) {
      return res.status(416).send("Range header required");
    }

    const params = {
      Bucket: process.env.AWS_BUCKET!,
      Key: s3Key,
    };

    const head = await s3.headObject(params).promise();
    const fileSize = head.ContentLength!;
    const chunkSize = 10 ** 6;

    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, fileSize - 1);

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
