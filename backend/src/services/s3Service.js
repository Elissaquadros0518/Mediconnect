import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/aws.js';

function getActiveBucket() {
  if (!process.env.S3_BUCKET) {
    throw new Error('S3_BUCKET is required');
  }
  return process.env.S3_BUCKET;
}

export async function generateUploadPresignedUrl(objectKey, mimeType) {
  const bucket = getActiveBucket();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: mimeType
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export async function generateDownloadPresignedUrl(objectKey) {
  const bucket = getActiveBucket();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 600 });
}

export const createUploadUrl = generateUploadPresignedUrl;
export const createDownloadUrl = generateDownloadPresignedUrl;