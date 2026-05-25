-- 1. Add cpf_cnpj to informacoes_cliente_ubiqua
ALTER TABLE public.informacoes_cliente_ubiqua ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- 2. Fix RLS for informacoes_cliente_ubiqua to allow anonymous inserts
DROP POLICY IF EXISTS "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "all_select_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "all_select_informacoes_cliente" ON public.informacoes_cliente_ubiqua
  FOR SELECT TO public USING (true);

-- 3. Fix RLS for orcamentos_revenda_ubiqua
DROP POLICY IF EXISTS "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "anon_insert_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "all_select_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "all_select_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "update_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua;
CREATE POLICY "update_orcamentos_revenda_ubiqua" ON public.orcamentos_revenda_ubiqua
  FOR UPDATE TO public USING (true);

-- 4. Fix RLS for itens_orcamento_ubiqua
DROP POLICY IF EXISTS "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "anon_insert_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "all_select_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua;
CREATE POLICY "all_select_itens_orcamento_ubiqua" ON public.itens_orcamento_ubiqua
  FOR SELECT TO public USING (true);
