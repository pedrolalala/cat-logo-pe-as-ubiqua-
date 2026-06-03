CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.revenda_ubiqua ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.generate_product_slug(nome text, preco numeric)
RETURNS text AS $$
DECLARE
  base_slug text;
  price_str text;
BEGIN
  -- Use unaccent to remove accents and lower to lowercase
  base_slug := lower(public.unaccent(trim(COALESCE(nome, 'Sem nome'))));
  
  -- Replace non-alphanumeric with dash
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading and trailing dashes
  base_slug := trim(both '-' from base_slug);
  
  -- Format price (e.g. 199.90 -> 199-90)
  price_str := replace(to_char(COALESCE(preco, 0), 'FM999999990.00'), '.', '-');
  
  RETURN base_slug || '-' || price_str;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
  UPDATE public.revenda_ubiqua
  SET slug = public.generate_product_slug(COALESCE(desc_produto, descricao), valor_revenda)
  WHERE slug IS NULL;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_update_revenda_ubiqua_slug()
RETURNS trigger AS $$
BEGIN
  NEW.slug := public.generate_product_slug(COALESCE(NEW.desc_produto, NEW.descricao), NEW.valor_revenda);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_revenda_ubiqua_slug ON public.revenda_ubiqua;
CREATE TRIGGER trg_revenda_ubiqua_slug
  BEFORE INSERT OR UPDATE OF desc_produto, descricao, valor_revenda
  ON public.revenda_ubiqua
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_revenda_ubiqua_slug();

CREATE INDEX IF NOT EXISTS idx_revenda_ubiqua_slug ON public.revenda_ubiqua(slug);
