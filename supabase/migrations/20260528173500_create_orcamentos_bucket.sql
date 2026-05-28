DO $$
BEGIN
  -- Insert bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('orcamentos', 'orcamentos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'orcamentos' );

DROP POLICY IF EXISTS "Anon can upload" ON storage.objects;
CREATE POLICY "Anon can upload" ON storage.objects FOR INSERT TO anon WITH CHECK ( bucket_id = 'orcamentos' );

DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;
CREATE POLICY "Authenticated Users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'orcamentos' );
