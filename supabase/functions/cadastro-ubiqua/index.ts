/**
 * SPEC-169: cadastro do Catálogo Ubiqua sem confirmação de e-mail.
 *
 * A confirmação continua ligada no Supabase (vale para os outros sistemas). Esta função
 * cria a conta já confirmada via Admin API, e o site faz o login logo em seguida com a
 * mesma senha. Só cria conta — não concede papel nem acesso a nenhum dado.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    const { email, password } = await req.json()
    const emailNorm = String(email ?? '')
      .trim()
      .toLowerCase()
    const senha = String(password ?? '')

    if (!EMAIL_RE.test(emailNorm)) {
      return json({ error: 'E-mail inválido.' }, 400)
    }
    if (senha.length < 6) {
      return json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { error } = await admin.auth.admin.createUser({
      email: emailNorm,
      password: senha,
      email_confirm: true,
      user_metadata: { origem: 'catalogo-ubiqua' },
    })

    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        return json({ error: 'Este e-mail já tem conta. Use "Entrar".', code: 'email_exists' }, 409)
      }
      console.error('cadastro-ubiqua createUser:', error.message)
      return json({ error: 'Falha ao criar conta.' }, 400)
    }

    return json({ ok: true })
  } catch (e) {
    console.error('cadastro-ubiqua:', e instanceof Error ? e.message : e)
    return json({ error: 'Falha ao criar conta.' }, 500)
  }
})
