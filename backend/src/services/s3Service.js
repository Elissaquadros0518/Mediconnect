import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/aws.js';

export async function generateUploadPresignedUrl(objectKey, mimeType) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
    ContentType: mimeType
  });
  // URL expires in 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return uploadUrl;
}

export async function generateDownloadPresignedUrl(objectKey) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: objectKey
  });
  // URL expires in 10 minutes
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
  return downloadUrl;
}