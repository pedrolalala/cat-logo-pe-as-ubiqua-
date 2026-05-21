DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed administrative user (idempotent: skip if email already exists)
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
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    UPDATE public.usuarios SET role = 'admin' WHERE email = 'pedro@lucenera.com.br';
  END IF;
END $$;

-- Ensure RLS on informacoes_cliente_ubiqua allows public INSERT
ALTER TABLE public.informacoes_cliente_ubiqua ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção anon" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "Permitir inserção anon" ON public.informacoes_cliente_ubiqua
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura anon e auth" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "Permitir leitura anon e auth" ON public.informacoes_cliente_ubiqua
  FOR SELECT TO anon, authenticated
  USING (true);

-- Ensure public can insert quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "all_quotes_auth" ON public.quotes;
CREATE POLICY "all_quotes_auth" ON public.quotes
  FOR ALL TO public
  USING (true) WITH CHECK (true);
