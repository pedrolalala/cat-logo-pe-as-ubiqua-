DROP POLICY IF EXISTS "revenda_ubiqua_delete_admin_ubiqua" ON public.revenda_ubiqua;
CREATE POLICY "revenda_ubiqua_delete_admin_ubiqua" ON public.revenda_ubiqua
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_ubiqua u 
      WHERE u.id = auth.uid() AND u.nivel_acesso = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
    )
  );
