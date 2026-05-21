-- Add reference column to orcamentos
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS informacoes_cliente_id UUID REFERENCES public.informacoes_cliente_ubiqua(id) ON DELETE SET NULL;

DO $$
BEGIN
  -- informacoes_cliente_ubiqua
  DROP POLICY IF EXISTS "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
  CREATE POLICY "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua FOR INSERT TO anon, authenticated WITH CHECK (true);

  -- orcamentos
  DROP POLICY IF EXISTS "anon_insert_orcamentos" ON public.orcamentos;
  CREATE POLICY "anon_insert_orcamentos" ON public.orcamentos FOR INSERT TO anon, authenticated WITH CHECK (true);

  -- orcamento_itens
  DROP POLICY IF EXISTS "anon_insert_orcamento_itens" ON public.orcamento_itens;
  CREATE POLICY "anon_insert_orcamento_itens" ON public.orcamento_itens FOR INSERT TO anon, authenticated WITH CHECK (true);

  -- empresas
  DROP POLICY IF EXISTS "anon_select_empresas" ON public.empresas;
  CREATE POLICY "anon_select_empresas" ON public.empresas FOR SELECT TO anon, authenticated USING (true);
END $$;
