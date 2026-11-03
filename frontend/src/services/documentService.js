import { supabase } from '../lib/supabase.js';

export const documentService = {
  /**
   * Fetch all medical records for a patient
   */
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

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(doc => ({
      id: doc.id,
      title: doc.original_filename,
      documentType: doc.document_type || 'Diagnostic Report',
      date: new Date(doc.created_at).toISOString().split('T')[0],
      doctor: doc.profiles?.full_name || 'Medical Vault Upload',
      size: `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`,
      storagePath: doc.storage_path
    }));
  },

  /**
   * Upload a new medical record to private Supabase Storage bucket and register metadata
   */
  async uploadDocument({ patientId, file, documentType = 'Diagnostic Report', doctorName = '' }) {
    if (!file) throw new Error('No file provided for upload.');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to upload medical records.');

    // 1. Generate safe storage path in private bucket
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${patientId}/${Date.now()}_${cleanFileName}`;

    // 2. Upload file to private medical-documents bucket
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error('[documentService] Storage upload error:', storageError);
      throw new Error(`File upload failed: ${storageError.message}`);
    }

    // 3. Register metadata in PostgreSQL medical_documents table
    const { data: docRecord, error: dbError } = await supabase
      .from('medical_documents')
      .insert({
        patient_id: patientId,
        uploaded_by: user.id,
        document_type: documentType,
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size
      })
      .select()
      .single();

    if (dbError) {
      console.error('[documentService] Database record creation error:', dbError);
      throw new Error(`Failed to save document metadata: ${dbError.message}`);
    }

    // 4. Create persistent notification for patient
    await supabase.from('notifications').insert({
      user_id: patientId,
      title: 'New Medical Report Uploaded',
      message: `Your document "${file.name}" has been securely uploaded and encrypted to your Supabase vault.`,
      type: 'DOCUMENT'
    }).then(() => {}).catch(() => {});

    return {
      id: docRecord.id,
      title: file.name,
      documentType,
      date: new Date().toISOString().split('T')[0],
      doctor: doctorName || user.user_metadata?.full_name || 'Medical Vault Upload',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      storagePath
    };
  },

  /**
   * Generate an authorized, time-limited presigned download URL for a medical document
   */
  async getDownloadUrl(storagePath, fileName = 'medical_record.pdf') {
    if (!storagePath) throw new Error('Invalid document storage path.');

    const { data, error } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(storagePath, 3600); // 1-hour expiry

    if (error) {
      console.error('[documentService] Error creating signed URL:', error);
      throw error;
    }

    return data?.signedUrl;
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId, storagePath) {
    if (storagePath) {
      await supabase.storage
        .from('medical-documents')
        .remove([storagePath]);
    }

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
