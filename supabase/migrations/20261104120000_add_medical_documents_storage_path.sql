-- Add the document locator expected by Azure uploads and existing Supabase Storage flows.
-- Keep this nullable so existing metadata rows are preserved without inventing locators.
ALTER TABLE public.medical_documents
    ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Match the original schema's uniqueness for populated storage paths.
-- PostgreSQL permits multiple NULL values in a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS medical_documents_storage_path_key
    ON public.medical_documents (storage_path);

-- Make the newly visible column available to PostgREST immediately.
NOTIFY pgrst, 'reload schema';
