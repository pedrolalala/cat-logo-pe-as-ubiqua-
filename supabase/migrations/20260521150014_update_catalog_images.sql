DO $$
BEGIN
  UPDATE public.revenda_ubiqua
  SET imagem_catalogo_url = 'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/' || referencia || '_catalogo.jpg'
  WHERE referencia IS NOT NULL AND referencia != '';
END $$;
