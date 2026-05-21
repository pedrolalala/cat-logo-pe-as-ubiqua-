DO $DO$
BEGIN
  -- First pass: update using first 6 digits of cod_produto
  UPDATE public.revenda_ubiqua
  SET imagem_catalogo_url = 'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/' || LEFT(cod_produto::text, 6) || '_catalogo.jpg'
  WHERE cod_produto IS NOT NULL AND length(cod_produto::text) >= 6;

  -- Second pass: fallback to referencia if it starts with 6 digits
  UPDATE public.revenda_ubiqua
  SET imagem_catalogo_url = 'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/' || substring(referencia from '^[0-9]{6}') || '_catalogo.jpg'
  WHERE (cod_produto IS NULL OR length(cod_produto::text) < 6) 
    AND referencia ~ '^[0-9]{6}';
    
  -- Clear image URL if neither condition is met, preventing broken URLs from older mappings
  UPDATE public.revenda_ubiqua
  SET imagem_catalogo_url = NULL
  WHERE (cod_produto IS NULL OR length(cod_produto::text) < 6) 
    AND (referencia !~ '^[0-9]{6}' OR referencia IS NULL);
END $DO$;
