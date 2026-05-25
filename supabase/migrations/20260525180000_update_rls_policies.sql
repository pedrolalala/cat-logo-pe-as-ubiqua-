-- Ensure informacoes_cliente_ubiqua has cpf_cnpj (safe to run)
ALTER TABLE public.informacoes_cliente_ubiqua ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Drop existing policies if any, then create for revenda_ubiqua
DROP POLICY IF EXISTS "revenda_ubiqua_select" ON public.revenda_ubiqua;
CREATE POLICY "revenda_ubiqua_select" ON public.revenda_ubiqua
  FOR SELECT TO anon, authenticated USING (true);

-- For orcamentos_revenda_ubiqua
DROP POLICY IF EXISTS "all_select_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "all_select_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "update_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- For itens_orcamento_ubiqua
DROP POLICY IF EXISTS "all_select_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "all_select_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- For informacoes_cliente_ubiqua
DROP POLICY IF EXISTS "Permitir leitura anon e auth" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "Permitir leitura anon e auth" ON public.informacoes_cliente_ubiqua
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "all_select_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "all_select_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "anon_update_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
