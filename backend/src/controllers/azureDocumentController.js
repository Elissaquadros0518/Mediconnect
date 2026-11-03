import { createUserScopedSupabaseClient } from '../config/supabase.js';
import {
  MAX_DOCUMENT_SIZE_BYTES,
  createDownloadSas,
  createPatientBlobName,
  createUploadSas,
  deleteBlob,
  inspectUploadedBlob,
  isPatientBlobName,
  validateDocumentMetadata
} from '../services/azureBlobService.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAccessToken(req) {
  const authorization = req.headers.authorization || '';
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1] || null;
}

async function isAuthenticatedPatient(req) {
  const accessToken = getAccessToken(req);
  if (!accessToken || !UUID_PATTERN.test(req.user?.id || '')) return false;

  const userSupabase = createUserScopedSupabaseClient(accessToken);
  const { data: profile, error } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) throw error;
  return String(profile?.role || '').toLowerCase() === 'patient';
}

function getErrorStatus(error) {
  if (error?.statusCode === 404 || error?.status === 404) return 404;
  return 500;
}

export async function createAzureUploadUrl(req, res, next) {
  try {
    const { originalFilename, mimeType, fileSize } = req.body || {};
    if (!await isAuthenticatedPatient(req)) {
      return res.status(403).json({ error: 'Only authenticated patients can request document upload URLs.' });
    }
    if (!UUID_PATTERN.test(req.user.id || '')) {
      return res.status(403).json({ error: 'A valid authenticated patient identity is required.' });
    }

    const validationError = validateDocumentMetadata({ originalFilename, mimeType, fileSize });
    if (validationError) return res.status(400).json({ error: validationError });

    const blobName = createPatientBlobName(req.user.id, originalFilename);
    const { url, expiresOn } = await createUploadSas(blobName);
    return res.status(200).json({
      data: {
        uploadUrl: url,
        blobName,
        expiresAt: expiresOn.toISOString(),
        maxFileSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
        mimeType
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeAzureUpload(req, res, next) {
  try {
    const { blobName } = req.body || {};
    if (!await isAuthenticatedPatient(req)) {
      return res.status(403).json({ error: 'Only authenticated patients can complete document uploads.' });
    }
    if (!isPatientBlobName(blobName, req.user.id)) {
      return res.status(400).json({ error: 'The blob name is invalid for the authenticated patient.' });
    }

    const { blobClient, properties } = await inspectUploadedBlob(blobName);
    const validationError = validateDocumentMetadata({
      originalFilename: blobName,
      mimeType: properties.contentType,
      fileSize: properties.contentLength
    });

    if (validationError) {
      await deleteBlob(blobClient);
      return res.status(400).json({ error: 'Uploaded document must be a supported file type no larger than 20 MiB.' });
    }

    return res.status(200).json({
      data: {
        blobName,
        mimeType: properties.contentType,
        fileSize: properties.contentLength
      }
    });
  } catch (error) {
    if (getErrorStatus(error) === 404) return res.status(404).json({ error: 'Uploaded blob was not found.' });
    return next(error);
  }
}

export async function createAzureDownloadUrl(req, res, next) {
  try {
    const { documentId } = req.params;
    if (!UUID_PATTERN.test(documentId || '')) {
      return res.status(400).json({ error: 'A valid document ID is required.' });
    }

    const accessToken = getAccessToken(req);
    if (!accessToken) return res.status(401).json({ error: 'Access token missing or malformed.' });

    const userSupabase = createUserScopedSupabaseClient(accessToken);
    const { data: document, error } = await userSupabase
      .from('medical_documents')
      .select('id, patient_id, storage_path, mime_type, file_size')
      .eq('id', documentId)
      .maybeSingle();

    if (error) return next(error);
    // RLS hides records the caller cannot read; return the same response for not found and unauthorized.
    if (!document) return res.status(404).json({ error: 'Document not found.' });
    if (!isPatientBlobName(document.storage_path, document.patient_id)) {
      return res.status(409).json({ error: 'This document is not stored in Azure Blob Storage.' });
    }

    const { properties } = await inspectUploadedBlob(document.storage_path);
    const metadataValidationError = validateDocumentMetadata({
      originalFilename: document.storage_path,
      mimeType: document.mime_type,
      fileSize: Number(document.file_size)
    });
    const blobValidationError = validateDocumentMetadata({
      originalFilename: document.storage_path,
      mimeType: properties.contentType,
      fileSize: properties.contentLength
    });
    if (metadataValidationError || blobValidationError
      || properties.contentType !== document.mime_type
      || Number(document.file_size) !== properties.contentLength) {
      return res.status(404).json({ error: 'Document is unavailable.' });
    }

    const { url, expiresOn } = await createDownloadSas(document.storage_path);
    return res.status(200).json({ data: { downloadUrl: url, expiresAt: expiresOn.toISOString() } });
  } catch (error) {
    if (getErrorStatus(error) === 404) return res.status(404).json({ error: 'Document not found.' });
    return next(error);
  }
}
