-- Create storage bucket for face images
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-images', 'face-images', false);

-- RLS policies for face-images bucket
CREATE POLICY "Users can upload their own face images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'face-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own face images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'face-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage all face images"
ON storage.objects FOR ALL
USING (bucket_id = 'face-images');
