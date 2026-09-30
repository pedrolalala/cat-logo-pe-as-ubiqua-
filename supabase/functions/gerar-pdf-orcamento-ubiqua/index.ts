// SPEC-172: devolve o PDF (application/pdf) de um orçamento do Catálogo Ubiqua.
// Entrada: { quote_id }. Exige usuário logado; a leitura usa service role porque
// configuracao_empresa_ubiqua/usuarios_ubiqua do representante podem não estar
// visíveis para quem está gerando.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  carregarOrcamentoUbiqua,
  gerarPdfOrcamentoUbiqua,
  numeroOrcamento,
} from '../_shared/pdf-orcamento-ubiqua.ts'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Acesso não autorizado.' }, 401)

    let body: any
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Formato de requisição inválido. Esperado JSON.' }, 400)
    }
    const quoteId = body?.quote_id
    if (!quoteId) return json({ error: 'O ID do orçamento (quote_id) é obrigatório.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Usuário não autenticado.' }, 401)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const dados = await carregarOrcamentoUbiqua(admin, quoteId)
    if (!dados) return json({ error: 'Orçamento não encontrado.' }, 404)

    const pdf = await gerarPdfOrcamentoUbiqua(dados)
    return new Response(pdf, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Orcamento_${numeroOrcamento(dados.orcamento)}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('[gerar-pdf-orcamento-ubiqua]', error?.message, error?.stack)
    return json({ error: error?.message || 'Falha ao gerar o PDF.' }, 500)
  }
})
