import test from 'node:test';
import assert from 'node:assert/strict';
import { createDownloadUrl, createUploadUrl } from '../src/services/s3Service.js';

test('document URL creation fails explicitly when the bucket is not configured', async () => {
  const previous = process.env.S3_BUCKET;
  delete process.env.S3_BUCKET;
  await assert.rejects(createUploadUrl('test-key', 'application/pdf'), /S3_BUCKET is required/);
  await assert.rejects(createDownloadUrl('test-key'), /S3_BUCKET is required/);
  if (previous !== undefined) process.env.S3_BUCKET = previous;
});
