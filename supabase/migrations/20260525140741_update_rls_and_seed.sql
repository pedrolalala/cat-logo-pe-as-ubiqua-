DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user (idempotent)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'pedro@lucenera.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- Clean up any existing permissive policies for revenda_ubiqua
DROP POLICY IF EXISTS "revenda_ubiqua_insert_policy" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_select_policy" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_update_policy" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_delete_policy" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_select" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_insert" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_update" ON public.revenda_ubiqua;
DROP POLICY IF EXISTS "revenda_ubiqua_delete" ON public.revenda_ubiqua;

ALTER TABLE public.revenda_ubiqua ENABLE ROW LEVEL SECURITY;

-- Allow public to select
CREATE POLICY "revenda_ubiqua_select" ON public.revenda_ubiqua
  FOR SELECT TO public USING (true);

-- Allow authenticated admins/gerentes to insert
CREATE POLICY "revenda_ubiqua_insert" ON public.revenda_ubiqua
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
    )
  );

-- Allow authenticated admins/gerentes to update
CREATE POLICY "revenda_ubiqua_update" ON public.revenda_ubiqua
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
    )
  );

-- Allow authenticated admins/gerentes to delete
CREATE POLICY "revenda_ubiqua_delete" ON public.revenda_ubiqua
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'gerente')
    )
  );
