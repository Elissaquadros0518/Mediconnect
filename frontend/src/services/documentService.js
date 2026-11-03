import { supabase } from '../lib/supabase.js';
import api from './api.js';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Map([
  ['application/pdf', ['.pdf']],
  ['image/png', ['.png']],
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/webp', ['.webp']]
]);

function isAzureStoragePath(storagePath) {
  return typeof storagePath === 'string' && storagePath.startsWith('azure/patients/');
}

async function getAccessToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Authentication required to access medical documents.');
  return session.access_token;
}

function validateFile(file) {
  if (file.size < 1 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size must be between 1 byte and 20 MiB.');
  }

  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const allowedExtensions = ALLOWED_FILE_TYPES.get(file.type);
  if (!allowedExtensions?.includes(extension)) {
    throw new Error('Only PDF, PNG, JPEG, and WebP files with a matching extension are allowed.');
  }
}

export const documentService = {
  /** Fetch document metadata from Supabase; its existing RLS policies remain in force. */
  async getPatientDocuments(patientId) {
    const { data, error } = await supabase
      .from('medical_documents')
      .select(`
        id,
        document_type,
        original_filename,
        storage_path,
        mime_type,
        file_size,
        created_at,
        uploaded_by,
        profiles:uploaded_by ( full_name )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[documentService] Error fetching patient documents:', error);
      throw error;
    }

    return (data || []).map(doc => ({
      id: doc.id,
      title: doc.original_filename,
      documentType: doc.document_type || 'Diagnostic Report',
      date: new Date(doc.created_at).toISOString().split('T')[0],
      doctor: doc.profiles?.full_name || 'Medical Vault Upload',
      size: `${(Number(doc.file_size) / (1024 * 1024)).toFixed(1)} MB`,
      storagePath: doc.storage_path
    }));
  },

  /** Request a patient-scoped SAS, upload to Azure, then register metadata through the backend. */
  async uploadDocument({ patientId, file, documentType = 'Diagnostic Report', doctorName = '' }) {
    if (!file) throw new Error('No file provided for upload.');
    validateFile(file);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to upload medical records.');
    if (patientId !== user.id) throw new Error('Documents can only be uploaded to your own patient record.');

    const accessToken = await getAccessToken();
    const authConfig = { headers: { Authorization: `Bearer ${accessToken}` } };
    const uploadResponse = await api.post('/documents/azure/upload-url', {
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size
    }, authConfig);
    const { uploadUrl, blobName } = uploadResponse.data || {};
    if (!uploadUrl || !blobName) throw new Error('The backend did not return an Azure upload URL.');

    let uploadResult;
    try {
      uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type
        },
        body: file
      });
    } catch {
      throw new Error('File upload to Azure Blob Storage failed. Check the storage CORS configuration and try again.');
    }
    if (!uploadResult.ok) {
      throw new Error(`File upload to Azure Blob Storage failed (HTTP ${uploadResult.status}).`);
    }

    const completion = await api.post('/documents/azure/complete-upload', {
      blobName,
      originalFilename: file.name,
      documentType
    }, authConfig);
    const docRecord = completion.data?.document;
    if (!docRecord?.id) throw new Error('The upload completed, but document metadata was not registered.');

    // Preserve the existing notification workflow after the document row is committed.
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'New Medical Report Uploaded',
      message: `Your document "${file.name}" has been securely uploaded to Azure Blob Storage.`,
      type: 'DOCUMENT'
    }).then(() => {}).catch(() => {});

    return {
      id: docRecord.id,
      title: docRecord.original_filename || file.name,
      documentType: docRecord.document_type || documentType,
      date: new Date(docRecord.created_at || Date.now()).toISOString().split('T')[0],
      doctor: doctorName || user.user_metadata?.full_name || 'Medical Vault Upload',
      size: `${(Number(docRecord.file_size || file.size) / (1024 * 1024)).toFixed(1)} MB`,
      storagePath: docRecord.storage_path || blobName
    };
  },

  /** Azure documents use the authenticated backend; existing Supabase objects retain signed URLs. */
  async getDownloadUrl(documentId, storagePath) {
    if (!documentId) throw new Error('Invalid document ID.');
    if (isAzureStoragePath(storagePath)) {
      const accessToken = await getAccessToken();
      const response = await api.get(`/documents/azure/${encodeURIComponent(documentId)}/download-url`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const downloadUrl = response.data?.downloadUrl;
      if (!downloadUrl) throw new Error('The backend did not return an Azure download URL.');
      return downloadUrl;
    }

    if (!storagePath) throw new Error('Invalid document storage path.');
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(storagePath, 3600);
    if (error) {
      console.error('[documentService] Error creating Supabase signed URL:', error);
      throw error;
    }
    return data?.signedUrl;
  },

  /** Fetch an authorized document and initiate a browser download without opening a popup. */
  async downloadDocument(documentId, storagePath, filename = 'medical-document') {
    const downloadUrl = await this.getDownloadUrl(documentId, storagePath);
    if (!downloadUrl) throw new Error('A download URL was not returned for this document.');

    let response;
    try {
      response = await fetch(downloadUrl);
    } catch {
      throw new Error('The document could not be retrieved. Check storage CORS settings and your connection.');
    }
    if (!response.ok) {
      throw new Error(`The document download failed (HTTP ${response.status}).`);
    }

    let fileBlob;
    try {
      fileBlob = await response.blob();
    } catch {
      throw new Error('The document response could not be read as a file.');
    }
    if (!fileBlob.size) throw new Error('The downloaded document is empty.');

    const objectUrl = URL.createObjectURL(fileBlob);
    const link = window.document.createElement('a');
    link.href = objectUrl;
    link.download = String(filename || 'medical-document').replace(/[\\/]/g, '_');
    link.style.display = 'none';
    window.document.body.appendChild(link);
    try {
      link.click();
    } catch {
      throw new Error('The browser could not start the document download.');
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    }
    return true;
  },

  /** Delete Azure blobs through the authenticated backend; legacy Supabase objects remain supported. */
  async deleteDocument(documentId, storagePath) {
    if (!documentId) throw new Error('Invalid document ID.');

    if (isAzureStoragePath(storagePath)) {
      const accessToken = await getAccessToken();
      await api.delete(`/documents/azure/${encodeURIComponent(documentId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return true;
    }

    if (!storagePath) throw new Error('Invalid document storage path.');
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .remove([storagePath]);
    if (storageError) throw storageError;

    const { error } = await supabase
      .from('medical_documents')
      .delete()
      .eq('id', documentId);
    if (error) {
      console.error('[documentService] Error deleting document record:', error);
      throw error;
    }
    return true;
  }
};

export default documentService;
