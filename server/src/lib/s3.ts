import * as AWS from "aws-sdk";

// Note: Environment variables are validated at startup in index.ts
// before this module is used, so non-null assertions are safe here
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

export const s3 = new AWS.S3();
