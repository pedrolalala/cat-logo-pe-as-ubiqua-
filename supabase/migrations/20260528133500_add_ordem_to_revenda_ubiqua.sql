ALTER TABLE public.revenda_ubiqua ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_revenda_ubiqua_ordem(payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  item jsonb;
  v_caller_role public.usuario_role;
BEGIN
  SELECT role INTO v_caller_role FROM public.usuarios WHERE id = auth.uid();
  
  IF v_caller_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'Apenas administradores e gerentes podem reordenar o catálogo.';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(payload)
  LOOP
    UPDATE public.revenda_ubiqua
    SET ordem = (item->>'ordem')::integer
    WHERE id = (item->>'id')::integer;
  END LOOP;
END;
$function$;
