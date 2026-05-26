-- Enable RLS and add select policies for revenda_ubiqua table
ALTER TABLE public.revenda_ubiqua ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revenda_ubiqua_select" ON public.revenda_ubiqua;
CREATE POLICY "revenda_ubiqua_select" ON public.revenda_ubiqua
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "revenda_ubiqua_select_anon" ON public.revenda_ubiqua;
CREATE POLICY "revenda_ubiqua_select_anon" ON public.revenda_ubiqua
  FOR SELECT TO anon USING (true);

-- Grant select permissions on the view for authenticated and anon users
GRANT SELECT ON public.vw_catalogo_unificado TO authenticated;
GRANT SELECT ON public.vw_catalogo_unificado TO anon;
