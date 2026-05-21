ALTER TABLE public.orcamentos 
  ADD COLUMN IF NOT EXISTS informacoes_cliente_id UUID REFERENCES public.informacoes_cliente_ubiqua(id) ON DELETE SET NULL;

ALTER TABLE public.informacoes_cliente_ubiqua ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

-- Policies for informacoes_cliente_ubiqua
DROP POLICY IF EXISTS "Permitir inserção anon" ON public.informacoes_cliente_ubiqua;
DROP POLICY IF EXISTS "anon_insert_informacoes_cliente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "anon_insert_informacoes_cliente" 
  ON public.informacoes_cliente_ubiqua 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

-- Policies for orcamentos
DROP POLICY IF EXISTS "anon_insert_orcamentos" ON public.orcamentos;
CREATE POLICY "anon_insert_orcamentos" 
  ON public.orcamentos 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

-- Policies for orcamento_itens
DROP POLICY IF EXISTS "anon_insert_orcamento_itens" ON public.orcamento_itens;
CREATE POLICY "anon_insert_orcamento_itens" 
  ON public.orcamento_itens 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);
