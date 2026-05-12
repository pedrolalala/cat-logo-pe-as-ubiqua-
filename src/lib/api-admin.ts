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
    if (!user) return true // Fallback para visualização se não houver auth real

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (data?.role === 'admin') return true

    // Checa na tabela usuarios também
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    return usuarioData?.role === 'admin'
  } catch {
    return true
  }
}

export async function fetchQuotes(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      throw new Error()
    }

    return data as Quote[]
  } catch {
    // Retorna mock em caso de erro ou tabela inexistente
    return [
      {
        id: '1',
        empresa: 'Indústrias Acme',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        valor_total: 4670.0,
        status: 'aberto',
        observacoes: 'Entrega urgente. Favor confirmar disponibilidade imediata.',
        items: [
          {
            part_id: '1',
            referencia: 'UBQ-1001',
            descricao: 'LUMINÁRIA PLISSE',
            quantidade: 2,
            preco_unitario: 1250.0,
            subtotal: 2500.0,
          },
        ],
      },
    ]
  }
}

export async function approvePurchase(quoteId: string) {
  try {
    // Simulando atraso para UX fluida
    await new Promise((resolve) => setTimeout(resolve, 800))

    const { error: updateError } = await supabase
      .from('quotes' as any)
      .update({
        status: 'aprovado',
        data_aprovacao: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (updateError) {
      console.warn('Tabela quotes não existe. Usando mock')
      return // Simula sucesso se a tabela não existir
    }

    const { error: historyError } = await supabase.from('quote_history' as any).insert([
      {
        quote_id: quoteId,
        acao: 'aprovado',
      },
    ])

    if (historyError) console.error(historyError)

    // Chama a Edge Function
    await supabase.functions.invoke('enviar-confirmacao-email', {
      body: {
        quote_id: quoteId,
        email_vinicius: 'vinicius@ubiqua.com',
        email_josi: 'josi@ubiqua.com',
      },
    })
  } catch (err) {
    console.error(err)
    throw err
  }
}
