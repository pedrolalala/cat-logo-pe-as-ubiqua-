import { supabase } from '@/lib/supabase/client'

export interface QuoteItem {
  part_id: string
  referencia: string
  descricao?: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export interface Quote {
  id: string
  empresa?: string
  created_at?: string
  data_criacao?: string
  valor_total: number
  status: string
  observacoes?: string
  items: QuoteItem[]
  data_aprovacao?: string
}

export async function checkAdminRole(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase.from('usuarios').select('role').eq('id', user.id).single()

    return data?.role === 'admin'
  } catch {
    return false
  }
}

export async function fetchQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []) as Quote[]
}

export async function approvePurchase(quoteId: string) {
  try {
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'aprovado',
        data_aprovacao: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (updateError) {
      throw updateError
    }

    const { data: userData } = await supabase.auth.getUser()

    const { error: historyError } = await supabase.from('quote_history').insert([
      {
        quote_id: quoteId,
        acao: 'aprovado',
        created_by: userData?.user?.id,
      },
    ])

    if (historyError) throw historyError

    // Chama a Edge Function
    const { error: invokeError } = await supabase.functions.invoke('enviar-confirmacao-email', {
      body: {
        quote_id: quoteId,
        email_vinicius: 'vinicius@ubiqua.com',
        email_josi: 'josi@ubiqua.com',
      },
    })

    if (invokeError) throw invokeError
  } catch (err) {
    console.error(err)
    throw err
  }
}
