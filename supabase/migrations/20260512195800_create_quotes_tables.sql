CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto',
  observacoes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_aprovacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quote_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "all_quotes_auth" ON public.quotes;
CREATE POLICY "all_quotes_auth" ON public.quotes FOR ALL USING (true);

DROP POLICY IF EXISTS "all_quote_history_auth" ON public.quote_history;
CREATE POLICY "all_quote_history_auth" ON public.quote_history FOR ALL USING (true);
