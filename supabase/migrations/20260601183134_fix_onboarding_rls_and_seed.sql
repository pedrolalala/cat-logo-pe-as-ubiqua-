-- 1. Fix RLS policy on empresa_ubiqua for SELECT to avoid circular dependency on insert
DROP POLICY IF EXISTS "empresa_ubiqua_select" ON public.empresa_ubiqua;

CREATE POLICY "empresa_ubiqua_select" ON public.empresa_ubiqua
  FOR SELECT TO authenticated USING (true);

-- 2. Seed user pedro@lucenera.com.br as admin for testing
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pedro@lucenera.com.br') THEN
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
      '{"nome": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    -- Insert into usuarios_ubiqua (the app's main auth link table for this frontend)
    INSERT INTO public.usuarios_ubiqua (id, email, nome, onboarding_completado)
    VALUES (v_user_id, 'pedro@lucenera.com.br', 'Pedro', false)
    ON CONFLICT (id) DO NOTHING;
    
    -- Ensure the role in public.usuarios is admin (trigger handle_new_auth_user might have created it as viewer)
    UPDATE public.usuarios SET role = 'admin' WHERE id = v_user_id;
  END IF;
END $$;
