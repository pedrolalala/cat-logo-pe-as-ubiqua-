DO $$
BEGIN
  -- Ensure RLS is permissive enough for the submission flow
  DROP POLICY IF EXISTS "auth_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
  CREATE POLICY "auth_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua 
    FOR INSERT TO authenticated WITH CHECK (true);
  
  DROP POLICY IF EXISTS "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
  CREATE POLICY "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua 
    FOR INSERT TO anon WITH CHECK (true);

  DROP POLICY IF EXISTS "auth_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
  CREATE POLICY "auth_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua 
    FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
  CREATE POLICY "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua 
    FOR INSERT TO anon WITH CHECK (true);

  DROP POLICY IF EXISTS "auth_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
  CREATE POLICY "auth_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua 
    FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
  CREATE POLICY "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua 
    FOR INSERT TO anon WITH CHECK (true);
END $$;
