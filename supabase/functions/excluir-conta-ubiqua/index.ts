/**
 * SPEC-170: o representante do Catálogo Ubiqua exclui a própria conta.
 *
 * Só apaga a conta de quem chama (identificada pelo token da sessão). Recusa conta da equipe
 * Lucenera (`usuarios`: apagar em cascata levaria o acesso a todos os sistemas e a Memória
 * Lucenera), admin do Ubiqua e representante com clientes cadastrados. Apaga também a empresa
 * criada no onboarding quando nenhum outro representante está ligado a ela. Orçamentos
 * já enviados não têm FK para o usuário e ficam guardados.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405)
  }

  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { data: auth, error: authError } = await admin.auth.getUser(token)
    if (authError || !auth.user) {
      return json({ error: 'Sessão inválida. Entre de novo.' }, 401)
    }
    const userId = auth.user.id

    // Toda checagem falha fechada: se a consulta der erro, não exclui.
    const falhaChecagem = () => json({ error: 'Não foi possível verificar a conta.' }, 500)

    const { data: equipe, error: equipeError } = await admin
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (equipeError) return falhaChecagem()
    if (equipe) {
      return json(
        { error: 'Contas da equipe Lucenera não podem ser excluídas por aqui.', code: 'equipe' },
        403,
      )
    }

    const { data: rep, error: repError } = await admin
      .from('usuarios_ubiqua')
      .select('empresa_id, nivel_acesso')
      .eq('id', userId)
      .maybeSingle()
    if (repError) return falhaChecagem()
    if (rep?.nivel_acesso === 'admin') {
      return json(
        { error: 'Conta de administrador não pode ser excluída por aqui.', code: 'admin' },
        403,
      )
    }

    const { count: clientes, error: clientesError } = await admin
      .from('informacoes_cliente_ubiqua')
      .select('*', { count: 'exact', head: true })
      .eq('cadastrado_por_usuario_id', userId)
    if (clientesError) return falhaChecagem()
    if ((clientes ?? 0) > 0) {
      return json(
        {
          error: 'Você tem clientes cadastrados. Fale com a Ubiqua para excluir a conta.',
          code: 'tem_clientes',
        },
        409,
      )
    }

    // Apaga o usuário do Auth; usuarios_ubiqua sai junto (FK on delete cascade).
    const { error: delError } = await admin.auth.admin.deleteUser(userId)
    if (delError) {
      console.error('excluir-conta-ubiqua deleteUser:', delError.message)
      return json({ error: 'Falha ao excluir a conta.' }, 500)
    }

    if (rep?.empresa_id) {
      const { count: outros, error: outrosError } = await admin
        .from('usuarios_ubiqua')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', rep.empresa_id)
      if (!outrosError && outros === 0) {
        const { error: empError } = await admin
          .from('empresa_ubiqua')
          .delete()
          .eq('id', rep.empresa_id)
        if (empError) console.error('excluir-conta-ubiqua empresa:', empError.message)
      }
    }

    return json({ ok: true })
  } catch (e) {
    console.error('excluir-conta-ubiqua:', e instanceof Error ? e.message : e)
    return json({ error: 'Falha ao excluir a conta.' }, 500)
  }
})
