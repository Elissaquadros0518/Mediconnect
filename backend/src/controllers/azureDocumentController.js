import { createUserScopedSupabaseClient } from '../config/supabase.js';
import {
  MAX_DOCUMENT_SIZE_BYTES,
  createDownloadSas,
  createPatientBlobName,
  createUploadSas,
  deleteBlob,
  hasValidDocumentSignature,
  inspectUploadedBlob,
  isPatientBlobName,
  validateDocumentMetadata
} from '../services/azureBlobService.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOCUMENT_TYPES = new Set([
  'Diagnostic Report',
  'X-Ray / MRI Scan',
  'Prescription',
  'Lab Test Result',
  'Discharge Summary'
]);

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

function getUserSupabase(req) {
  const accessToken = getAccessToken(req);
  return accessToken ? createUserScopedSupabaseClient(accessToken) : null;
}

function getErrorStatus(error) {
  if (error?.statusCode === 404 || error?.status === 404) return 404;
  return 500;
}

function sanitizeDiagnosticText(value, maxLength = 240) {
  return String(value ?? '')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[url]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]')
    .replace(/\bazure\/patients\/[^\s"'<>?]+/gi, '[blob-path]')
    .replace(/\b(?:authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|sig|sas|token)\s*[:=]\s*[^\s,;&]+(?:&[^\s,;]+)*/gi, '[credential-redacted]')
    .replace(/\?[^\s"'<>]*/g, '?[redacted]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, maxLength);
}

function logOperationError(operation, error) {
  const source = error && typeof error === 'object' ? error : {};
  const rawName = typeof source.name === 'string'
    ? source.name
    : (error == null ? 'MissingError' : (typeof error === 'string' ? 'ThrownString' : 'ThrownValue'));
  const rawMessage = typeof source.message === 'string'
    ? source.message
    : (typeof error === 'string' ? error : 'No error message available');
  const safeCode = typeof source.code === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(source.code)
    ? source.code
    : undefined;
  const rawStatus = source.statusCode ?? source.status;
  const status = Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599 ? rawStatus : undefined;

  console.error('[document-upload-diagnostic]', JSON.stringify({
    operation,
    name: sanitizeDiagnosticText(rawName, 80),
    message: sanitizeDiagnosticText(rawMessage),
    ...(safeCode ? { code: safeCode } : {}),
    ...(status ? { status } : {})
  }));
}

async function deleteBlobWithDiagnostics(blobClient) {
  try {
    const deleted = await deleteBlob(blobClient);
    if (!deleted) {
      logOperationError('azure_blob_cleanup', {
        name: 'BlobCleanupError',
        message: 'Blob delete operation reported that no blob was deleted.'
      });
    }
    return deleted;
  } catch (error) {
    logOperationError('azure_blob_cleanup', error);
    throw error;
  }
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
  let blobClient;
  let operation = 'patient_profile_lookup';
  try {
    const { blobName, originalFilename, documentType } = req.body || {};
    if (!await isAuthenticatedPatient(req)) {
      return res.status(403).json({ error: 'Only authenticated patients can complete document uploads.' });
    }
    if (!isPatientBlobName(blobName, req.user.id)) {
      return res.status(400).json({ error: 'The blob name is invalid for the authenticated patient.' });
    }
    if (typeof originalFilename !== 'string' || originalFilename.trim().length === 0 || originalFilename.length > 255) {
      return res.status(400).json({ error: 'A filename between 1 and 255 characters is required.' });
    }
    if (!DOCUMENT_TYPES.has(documentType)) {
      return res.status(400).json({ error: 'A supported document type is required.' });
    }

    operation = 'azure_blob_property_lookup';
    const inspectedBlob = await inspectUploadedBlob(blobName);
    blobClient = inspectedBlob.blobClient;
    const { properties } = inspectedBlob;
    const validationError = validateDocumentMetadata({
      originalFilename: blobName,
      mimeType: properties.contentType,
      fileSize: properties.contentLength
    });

    if (validationError) {
      operation = 'azure_blob_cleanup';
      await deleteBlobWithDiagnostics(blobClient);
      return res.status(400).json({ error: 'Uploaded document must be a supported file type no larger than 20 MiB.' });
    }

    operation = 'azure_document_signature_read';
    const validSignature = await hasValidDocumentSignature(blobClient, properties.contentType, properties.contentLength);
    if (!validSignature) {
      operation = 'azure_blob_cleanup';
      await deleteBlobWithDiagnostics(blobClient);
      blobClient = null;
      return res.status(400).json({ error: 'The uploaded file content does not match its declared document type.' });
    }

    operation = 'supabase_metadata_insert';
    const userSupabase = getUserSupabase(req);
    const { data: document, error } = await userSupabase
      .from('medical_documents')
      .insert({
        patient_id: req.user.id,
        uploaded_by: req.user.id,
        document_type: documentType,
        original_filename: originalFilename.trim(),
        storage_path: blobName,
        mime_type: properties.contentType,
        file_size: properties.contentLength
      })
      .select('id, patient_id, uploaded_by, document_type, original_filename, storage_path, mime_type, file_size, created_at')
      .single();

    if (error) {
      logOperationError(operation, error);
      try {
        await deleteBlobWithDiagnostics(blobClient);
      } catch {
        // Cleanup failure is logged separately; preserve the original Supabase error.
      }
      return next(error);
    }

    return res.status(200).json({
      data: {
        id: document.id,
        blobName,
        mimeType: properties.contentType,
        fileSize: properties.contentLength,
        document
      }
    });
  } catch (error) {
    logOperationError(operation, error);
    if (blobClient) {
      try {
        await deleteBlobWithDiagnostics(blobClient);
      } catch {
        // Cleanup failure is logged separately; preserve the original operation error.
      }
    }
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

    const userSupabase = getUserSupabase(req);
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

export async function deleteAzureDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    if (!UUID_PATTERN.test(documentId || '')) {
      return res.status(400).json({ error: 'A valid document ID is required.' });
    }

    const userSupabase = getUserSupabase(req);
    if (!userSupabase) return res.status(401).json({ error: 'Access token missing or malformed.' });

    const { data: document, error: lookupError } = await userSupabase
      .from('medical_documents')
      .select('id, patient_id, storage_path')
      .eq('id', documentId)
      .maybeSingle();

    if (lookupError) return next(lookupError);
    if (!document) return res.status(404).json({ error: 'Document not found.' });
    if (!isPatientBlobName(document.storage_path, document.patient_id)) {
      return res.status(409).json({ error: 'This document is not stored in Azure Blob Storage.' });
    }

    const callerId = req.user.id;
    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .maybeSingle();

    if (profileError) return next(profileError);
    const callerRole = String(profile?.role || '').toLowerCase();
    if (!(callerRole === 'admin' || (callerRole === 'patient' && document.patient_id === callerId))) {
      return res.status(403).json({ error: 'You are not authorized to delete this document.' });
    }

    const { blobClient } = await inspectUploadedBlob(document.storage_path);
    const deleted = await deleteBlob(blobClient);
    if (!deleted) return res.status(404).json({ error: 'Azure document blob was not found.' });

    const { data: deletedRows, error: deleteError } = await userSupabase
      .from('medical_documents')
      .delete()
      .eq('id', documentId)
      .select('id');

    if (deleteError) return next(deleteError);
    if (!deletedRows?.length) {
      return res.status(500).json({ error: 'The blob was deleted, but its metadata could not be removed.' });
    }

    return res.status(200).json({ data: { id: documentId, deleted: true } });
  } catch (error) {
    if (getErrorStatus(error) === 404) return res.status(404).json({ error: 'Document not found.' });
    return next(error);
  }
}
