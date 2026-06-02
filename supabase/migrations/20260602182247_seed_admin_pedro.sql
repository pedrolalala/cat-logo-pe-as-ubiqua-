DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Insert into auth.users if not exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'pedro@lucenera.com.br';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
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
  END IF;

  -- 2. Upsert public.usuarios
  INSERT INTO public.usuarios (id, email, nome, role, onboarding_completado)
  VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    onboarding_completado = true;

  -- 3. Upsert public.usuarios_ubiqua
  INSERT INTO public.usuarios_ubiqua (id, email, nome, nivel_acesso, onboarding_completado)
  VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    nivel_acesso = 'admin',
    onboarding_completado = true;

END $$;
