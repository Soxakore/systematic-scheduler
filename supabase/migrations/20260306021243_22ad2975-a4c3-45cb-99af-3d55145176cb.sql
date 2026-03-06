
-- Create storage bucket for vision board images
INSERT INTO storage.buckets (id, name, public) VALUES ('vision-images', 'vision-images', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload vision images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vision-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own vision images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vision-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own vision images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vision-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public can view vision images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vision-images');
