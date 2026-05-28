DO $$
BEGIN
  ALTER TABLE public.itens_orcamento_ubiqua DROP COLUMN IF EXISTS valor_total CASCADE;
  ALTER TABLE public.itens_orcamento_ubiqua ADD COLUMN valor_total NUMERIC GENERATED ALWAYS AS (((quantidade::numeric * valor_unitario) - COALESCE(desconto_item, 0))) STORED;
END $$;
