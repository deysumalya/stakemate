-- Create the 'proofs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (just in case it's not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access to the 'proofs' bucket
-- (This is required so Claude Vision can read the image URLs)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'proofs' );

-- 2. Allow authenticated users to upload files to the 'proofs' bucket
CREATE POLICY "Authenticated users can upload proofs" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'proofs' );

-- 3. (Optional) Allow users to delete their own proofs if needed
CREATE POLICY "Users can delete own proofs" 
ON storage.objects FOR DELETE
TO authenticated 
USING ( bucket_id = 'proofs' AND auth.uid() = owner );
