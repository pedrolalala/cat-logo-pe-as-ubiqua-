DO $$
DECLARE
  new_user_id uuid;
BEGIN
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

    INSERT INTO public.usuarios_ubiqua (id, email, nome, onboarding_completado)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

UPDATE public.empresa_ubiqua SET cnpj = '00.000.000/0000-00' WHERE cnpj IS NULL OR cnpj = '';
ALTER TABLE public.empresa_ubiqua ALTER COLUMN cnpj SET NOT NULL;

UPDATE public.informacoes_cliente_ubiqua SET cpf_cnpj = '00.000.000/0000-00' WHERE cpf_cnpj IS NULL OR cpf_cnpj = '';
ALTER TABLE public.informacoes_cliente_ubiqua ALTER COLUMN cpf_cnpj SET NOT NULL;

ALTER TABLE public.informacoes_cliente_ubiqua DROP COLUMN IF EXISTS data_nascimento;
