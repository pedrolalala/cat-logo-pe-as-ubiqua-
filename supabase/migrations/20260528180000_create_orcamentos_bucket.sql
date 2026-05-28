DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('orcamentos', 'orcamentos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "orcamentos_public_read" ON storage.objects;
CREATE POLICY "orcamentos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'orcamentos');

DROP POLICY IF EXISTS "orcamentos_authenticated_insert" ON storage.objects;
CREATE POLICY "orcamentos_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'orcamentos');
  
DROP POLICY IF EXISTS "orcamentos_authenticated_update" ON storage.objects;
CREATE POLICY "orcamentos_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'orcamentos');

DROP POLICY IF EXISTS "orcamentos_anon_insert" ON storage.objects;
CREATE POLICY "orcamentos_anon_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'orcamentos');
