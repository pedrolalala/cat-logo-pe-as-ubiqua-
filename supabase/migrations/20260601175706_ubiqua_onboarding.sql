CREATE TABLE IF NOT EXISTS public.empresa_ubiqua (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  cnpj TEXT UNIQUE,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usuarios_ubiqua (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresa_ubiqua(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  onboarding_completado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.empresa_ubiqua ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_ubiqua ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_ubiqua_select" ON public.empresa_ubiqua;
CREATE POLICY "empresa_ubiqua_select" ON public.empresa_ubiqua
  FOR SELECT TO authenticated USING (
    id IN (SELECT empresa_id FROM public.usuarios_ubiqua WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "empresa_ubiqua_insert" ON public.empresa_ubiqua;
CREATE POLICY "empresa_ubiqua_insert" ON public.empresa_ubiqua
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "empresa_ubiqua_update" ON public.empresa_ubiqua;
CREATE POLICY "empresa_ubiqua_update" ON public.empresa_ubiqua
  FOR UPDATE TO authenticated USING (
    id IN (SELECT empresa_id FROM public.usuarios_ubiqua WHERE id = auth.uid())
  ) WITH CHECK (
    id IN (SELECT empresa_id FROM public.usuarios_ubiqua WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "usuarios_ubiqua_select" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_select" ON public.usuarios_ubiqua
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "usuarios_ubiqua_insert" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_insert" ON public.usuarios_ubiqua
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "usuarios_ubiqua_update" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_update" ON public.usuarios_ubiqua
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

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

    INSERT INTO public.usuarios_ubiqua (id, nome, email, onboarding_completado)
    VALUES (new_user_id, 'Pedro', 'pedro@lucenera.com.br', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
