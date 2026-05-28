-- Policies for informacoes_cliente_ubiqua
DROP POLICY IF EXISTS "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "auth_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "anon_update_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "auth_update_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Policies for orcamentos_revenda_ubiqua
DROP POLICY IF EXISTS "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "auth_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "all_select_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "all_select_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR SELECT TO public USING (true);

-- Policies for itens_orcamento_ubiqua
DROP POLICY IF EXISTS "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "auth_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "all_select_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "all_select_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR SELECT TO public USING (true);
