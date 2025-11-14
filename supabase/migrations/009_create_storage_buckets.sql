-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('business-cards', 'business-cards', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('avatars', 'avatars', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('logos', 'logos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for business-cards bucket
CREATE POLICY "Users can upload business card files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-cards' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update business card files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-cards' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete business card files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-cards' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view business card files" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-cards');

-- Create storage policies for avatars bucket
CREATE POLICY "Users can upload avatar files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update avatar files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete avatar files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view avatar files" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Create storage policies for logos bucket
CREATE POLICY "Users can upload logo files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update logo files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete logo files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view logo files" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');
