-- Add data_nascimento column
ALTER TABLE IF EXISTS public.informacoes_cliente_ubiqua ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Update RLS for informacoes_cliente_ubiqua
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.informacoes_cliente_ubiqua;
DROP POLICY IF EXISTS "Permitir inserção anon" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "Permitir inserção anon" ON public.informacoes_cliente_ubiqua
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura apenas para admins" ON public.informacoes_cliente_ubiqua;
DROP POLICY IF EXISTS "Permitir leitura admin_gerente" ON public.informacoes_cliente_ubiqua;
CREATE POLICY "Permitir leitura admin_gerente" ON public.informacoes_cliente_ubiqua
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid() AND u.role IN ('admin'::public.usuario_role, 'gerente'::public.usuario_role)
    )
  );

-- Fix auth.users nulls if any exist (safety measure)
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- Seed admin user pedro@lucenera.com.br
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
      email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'pedro@lucenera.com.br',
      crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"nome": "Pedro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo)
    VALUES (new_user_id, 'pedro@lucenera.com.br', 'Pedro', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', ativo = true;
  END IF;
END $$;
