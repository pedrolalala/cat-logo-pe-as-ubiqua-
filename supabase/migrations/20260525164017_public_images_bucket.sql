-- Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('revenda-ubiqua-images', 'revenda-ubiqua-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies just in case to make it idempotent
DROP POLICY IF EXISTS "Anon public read for catalogos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated public read for catalogos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to catalog images" ON storage.objects;

-- Create policies to ensure public read access to this bucket
CREATE POLICY "Anon public read for catalogos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'revenda-ubiqua-images');

CREATE POLICY "Authenticated public read for catalogos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'revenda-ubiqua-images');
