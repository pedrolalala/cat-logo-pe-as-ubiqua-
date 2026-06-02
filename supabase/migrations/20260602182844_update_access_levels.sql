DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_acesso_tipo') THEN
    CREATE TYPE public.nivel_acesso_tipo AS ENUM ('revendedor', 'interno', 'admin');
  END IF;
END $$;

ALTER TABLE public.usuarios_ubiqua ADD COLUMN IF NOT EXISTS nivel_acesso public.nivel_acesso_tipo DEFAULT 'revendedor';

-- Seed pedro@lucenera.com.br into auth.users
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
      '{"name": "Pedro Leonel Laghi"}',
      false, 'authenticated', 'authenticated',
      '',    
      '',    
      '',    
      '',    
      '',    
      NULL,  
      '',    
      '',    
      ''     
    );
  END IF;
END $$;

-- Update specific users to admin
UPDATE public.usuarios_ubiqua
SET nivel_acesso = 'admin'
WHERE id IN (
  '935f1eb3-b18a-4b08-936d-b11313f6bff6'::uuid, 
  '99b32325-87bb-4387-9c75-610cd9fef816'::uuid
);

-- Function for RLS
CREATE OR REPLACE FUNCTION public.is_ubiqua_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_ubiqua
    WHERE id = auth.uid() AND nivel_acesso = 'admin'
  );
END;
$$;

-- RLS Update
DROP POLICY IF EXISTS "usuarios_ubiqua_select" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_select" ON public.usuarios_ubiqua
  FOR SELECT TO authenticated 
  USING (id = auth.uid() OR public.is_ubiqua_admin());

DROP POLICY IF EXISTS "usuarios_ubiqua_insert" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_insert" ON public.usuarios_ubiqua
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_ubiqua_admin());

DROP POLICY IF EXISTS "usuarios_ubiqua_update" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_update" ON public.usuarios_ubiqua
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_ubiqua_admin())
  WITH CHECK (id = auth.uid() OR public.is_ubiqua_admin());

DROP POLICY IF EXISTS "usuarios_ubiqua_delete" ON public.usuarios_ubiqua;
CREATE POLICY "usuarios_ubiqua_delete" ON public.usuarios_ubiqua
  FOR DELETE TO authenticated
  USING (id = auth.uid() OR public.is_ubiqua_admin());
