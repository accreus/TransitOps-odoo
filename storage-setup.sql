-- Storage setup for TransitOps documents
-- Run this after the main schema and RLS policies

-- Create storage bucket for documents (if not already created via code)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for documents bucket
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Fleet managers can delete any document" ON storage.objects;
CREATE POLICY "Fleet managers can delete any document" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    get_user_role(auth.uid()) = 'Fleet Manager'
  );

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    owner = auth.uid()
  );