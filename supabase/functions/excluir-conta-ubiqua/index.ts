/**
 * SPEC-170: o representante do Catálogo Ubiqua exclui a própria conta.
 *
 * Só apaga a conta de quem chama (identificada pelo token da sessão). Recusa conta da equipe
 * Lucenera (apagar em cascata levaria o acesso a todos os sistemas e a Memória Lucenera),
 * admin do Ubiqua e representante com clientes cadastrados. Apaga também o funcionário vazio
 * criado pelo gatilho handle_new_user e a empresa do onboarding quando nenhum outro
 * representante está ligado a ela. Orçamentos já enviados não têm FK para o usuário e ficam
 * guardados.
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

    // O gatilho handle_new_user põe TODA conta nova em `usuarios` (role 'viewer') e cria uma
    // linha vazia em `funcionarios`. Equipe de verdade = role acima de viewer, papel no Hub ou
    // funcionário com dados de RH preenchidos.
    const { data: usuario, error: usuarioError } = await admin
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (usuarioError) return falhaChecagem()

    const { count: papeis, error: papeisError } = await admin
      .from('usuario_papeis')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
    if (papeisError) return falhaChecagem()

    const { data: funcionarios, error: funcError } = await admin
      .from('funcionarios')
      .select(
        'id, cargo, departamento_id, data_admissao, tipo_contratacao, empresa_id, codigo_legado',
      )
      .eq('usuario_id', userId)
    if (funcError) return falhaChecagem()
    const funcionarioReal = (funcionarios ?? []).some(
      (f) =>
        f.cargo ||
        f.departamento_id ||
        f.data_admissao ||
        f.tipo_contratacao ||
        f.empresa_id ||
        f.codigo_legado,
    )

    const ehEquipe =
      (usuario != null && usuario.role !== 'viewer') || (papeis ?? 0) > 0 || funcionarioReal
    if (ehEquipe) {
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

    // Funcionário vazio criado pelo gatilho: a FK vira NULL ao apagar o usuário, então sobraria
    // um "funcionário Ativo" fantasma no RH. Só chega aqui se nenhum tiver dado real.
    const idsFuncionarios = (funcionarios ?? []).map((f) => f.id)
    if (idsFuncionarios.length > 0) {
      const { error: fError } = await admin.from('funcionarios').delete().in('id', idsFuncionarios)
      if (fError) console.error('excluir-conta-ubiqua funcionarios:', fError.message)
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
