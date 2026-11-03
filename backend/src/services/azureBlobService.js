import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { DefaultAzureCredential } from '@azure/identity';
import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  generateBlobSASQueryParameters
} from '@azure/storage-blob';

export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = Object.freeze({
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp']
});

const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL
  || 'https://mediconnectstorage01.blob.core.windows.net';
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'medical-documents';
const uploadSasTtlSeconds = Number(process.env.AZURE_BLOB_UPLOAD_SAS_TTL_SECONDS || 300);
const downloadSasTtlSeconds = Number(process.env.AZURE_BLOB_DOWNLOAD_SAS_TTL_SECONDS || 120);
const credential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(accountUrl, credential);
const accountName = new URL(accountUrl).hostname.split('.')[0];

function isAllowedDocumentType(mimeType, filename) {
  const allowedExtensions = ALLOWED_DOCUMENT_TYPES[mimeType];
  return Boolean(allowedExtensions?.includes(path.extname(filename).toLowerCase()));
}

export function validateDocumentMetadata({ originalFilename, mimeType, fileSize }) {
  if (typeof originalFilename !== 'string' || originalFilename.trim().length === 0 || originalFilename.length > 255) {
    return 'A filename between 1 and 255 characters is required.';
  }
  if (typeof mimeType !== 'string' || !isAllowedDocumentType(mimeType, originalFilename)) {
    return 'Only PDF, PNG, JPEG, and WebP documents are allowed, with a matching file extension.';
  }
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_DOCUMENT_SIZE_BYTES) {
    return `File size must be between 1 byte and ${MAX_DOCUMENT_SIZE_BYTES} bytes.`;
  }
  return null;
}

export function createPatientBlobName(patientId, originalFilename) {
  const extension = path.extname(originalFilename).toLowerCase();
  return `azure/patients/${patientId.toLowerCase()}/docs/${randomUUID()}${extension}`;
}

export function isPatientBlobName(blobName, patientId) {
  if (typeof blobName !== 'string' || typeof patientId !== 'string') return false;
  const escapedPatientId = patientId.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^azure/patients/${escapedPatientId}/docs/[0-9a-f-]{36}\\.(pdf|png|jpe?g|webp)$`, 'i').test(blobName);
}

function getBlobClient(blobName) {
  return blobServiceClient.getContainerClient(containerName).getBlobClient(blobName);
}

async function generateBlobSasUrl(blobName, permission, ttlSeconds) {
  const now = new Date();
  const startsOn = new Date(now.getTime() - 5 * 60 * 1000);
  const expiresOn = new Date(now.getTime() + ttlSeconds * 1000);
  const delegationKeyExpiresOn = new Date(expiresOn.getTime() + 5 * 60 * 1000);
  const delegationKey = await blobServiceClient.getUserDelegationKey(startsOn, delegationKeyExpiresOn);
  const sas = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: permission,
    startsOn,
    expiresOn,
    protocol: SASProtocol.Https
  }, delegationKey, accountName).toString();

  return { url: `${getBlobClient(blobName).url}?${sas}`, expiresOn };
}

export async function createUploadSas(blobName) {
  if (!Number.isInteger(uploadSasTtlSeconds) || uploadSasTtlSeconds < 60 || uploadSasTtlSeconds > 600) {
    throw new Error('AZURE_BLOB_UPLOAD_SAS_TTL_SECONDS must be between 60 and 600.');
  }
  return generateBlobSasUrl(blobName, BlobSASPermissions.parse('cw'), uploadSasTtlSeconds);
}

export async function inspectUploadedBlob(blobName) {
  const blobClient = getBlobClient(blobName);
  const properties = await blobClient.getProperties();
  return { blobClient, properties };
}

export async function deleteBlob(blobClient) {
  await blobClient.deleteIfExists();
}

export async function createDownloadSas(blobName) {
  if (!Number.isInteger(downloadSasTtlSeconds) || downloadSasTtlSeconds < 30 || downloadSasTtlSeconds > 300) {
    throw new Error('AZURE_BLOB_DOWNLOAD_SAS_TTL_SECONDS must be between 30 and 300.');
  }
  return generateBlobSasUrl(blobName, BlobSASPermissions.parse('r'), downloadSasTtlSeconds);
}
