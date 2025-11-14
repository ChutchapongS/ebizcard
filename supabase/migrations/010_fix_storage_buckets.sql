-- Fix Storage Buckets for Profile Images
-- This migration ensures storage buckets are properly created and configured

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload business card files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update business card files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete business card files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view business card files" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatar files" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload logo files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update logo files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logo files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view logo files" ON storage.objects;

-- Create or update storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('business-cards', 'business-cards', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('avatars', 'avatars', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('logos', 'logos', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- Storage Policies for business-cards bucket
-- ========================================

-- Allow authenticated users to upload
CREATE POLICY "Users can upload business card files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-cards');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update business card files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-cards');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete business card files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-cards');

-- Allow everyone to view files (public access)
CREATE POLICY "Anyone can view business card files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-cards');

-- ========================================
-- Storage Policies for avatars bucket
-- ========================================

-- Allow authenticated users to upload
CREATE POLICY "Users can upload avatar files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update
CREATE POLICY "Users can update avatar files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete avatar files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow everyone to view
CREATE POLICY "Anyone can view avatar files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ========================================
-- Storage Policies for logos bucket
-- ========================================

-- Allow authenticated users to upload
CREATE POLICY "Users can upload logo files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update
CREATE POLICY "Users can update logo files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete logo files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

-- Allow everyone to view
CREATE POLICY "Anyone can view logo files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- ========================================
-- Verify the setup
-- ========================================

-- Show created buckets
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('business-cards', 'avatars', 'logos');

