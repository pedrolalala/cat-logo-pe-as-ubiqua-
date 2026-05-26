CREATE OR REPLACE VIEW public.vw_catalogo_unificado AS
SELECT 
  TRIM(REGEXP_REPLACE(referencia, '-IS$', '', 'i')) as referencia_base,
  MAX(REGEXP_REPLACE(descricao, '-\s*(ISLIGHT|MANOELLA)\s*$', '', 'i')) as nome_exibicao,
  SUM(disponivel) as estoque_total,
  array_agg(DISTINCT TRIM(UPPER(COALESCE(cor, 'PADRÃO')))) as cores_disponiveis,
  MAX(imagem_catalogo_url) as imagem_principal,
  MIN(valor_revenda) as valor_minimo
FROM public.revenda_ubiqua
GROUP BY TRIM(REGEXP_REPLACE(referencia, '-IS$', '', 'i'));

GRANT SELECT ON public.vw_catalogo_unificado TO authenticated;
GRANT SELECT ON public.vw_catalogo_unificado TO anon;
