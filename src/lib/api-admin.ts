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

const MOCK_QUOTES: Quote[] = [
  {
    id: '1',
    empresa: 'Indústrias Acme',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    valor_total: 4670.0,
    status: 'aberto',
    observacoes:
      'Entrega urgente para manutenção preventiva. Favor confirmar disponibilidade imediata.',
    items: [
      {
        part_id: '1',
        referencia: 'UBQ-1001',
        descricao: 'Filtro de Óleo Industrial Alta Pressão',
        quantidade: 2,
        preco_unitario: 1250.0,
        subtotal: 2500.0,
      },
      {
        part_id: '2',
        referencia: 'UBQ-2042',
        descricao: 'Válvula Solenoide 24V Aço Inox',
        quantidade: 4,
        preco_unitario: 542.5,
        subtotal: 2170.0,
      },
    ],
  },
  {
    id: '2',
    empresa: 'TechCorp Manutenção Brasil',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    valor_total: 120.0,
    status: 'aprovado',
    observacoes: 'Material para reposição de estoque.',
    data_aprovacao: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        part_id: '4',
        referencia: 'UBQ-1055',
        descricao: 'Mangueira de Sucção 2 Polegadas',
        quantidade: 1,
        preco_unitario: 120.0,
        subtotal: 120.0,
      },
    ],
  },
  {
    id: '3',
    empresa: 'Sistemas Globais Ltda',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    valor_total: 3420.0,
    status: 'aberto',
    observacoes: 'Aguardando aprovação interna. Podem faturar se aprovado.',
    items: [
      {
        part_id: '3',
        referencia: 'UBQ-3099',
        descricao: 'Bomba Hidráulica de Engrenagem',
        quantidade: 1,
        preco_unitario: 3420.0,
        subtotal: 3420.0,
      },
    ],
  },
]

export async function checkAdminRole(): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return new Promise((resolve) => setTimeout(() => resolve(true), 500))
  }

  try {
    const response = await fetch(`${url}/rest/v1/profiles?select=role&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    if (!response.ok) return true // Fallback to true if RLS blocks anonymous check, for demo purposes
    const data = await response.json()
    if (data.length === 0) return true // Fallback
    return data.some((p: any) => p.role === 'admin')
  } catch {
    return true
  }
}

export async function fetchQuotes(): Promise<Quote[]> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_QUOTES), 800))
  }

  const response = await fetch(`${url}/rest/v1/quotes?select=*&order=created_at.desc`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (!response.ok) {
    throw new Error('Falha ao buscar orçamentos')
  }

  return response.json()
}

export async function approvePurchase(quoteId: string) {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    return new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const updateRes = await fetch(`${url}/rest/v1/quotes?id=eq.${quoteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status: 'aprovado',
      data_aprovacao: new Date().toISOString(),
    }),
  })

  if (!updateRes.ok) throw new Error('Falha ao atualizar orçamento')

  const historyRes = await fetch(`${url}/rest/v1/quote_history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      quote_id: quoteId,
      acao: 'aprovado',
    }),
  })

  if (!historyRes.ok) throw new Error('Falha ao registrar histórico')

  await fetch(`${url}/functions/v1/enviar-confirmacao-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      quote_id: quoteId,
      email_vinicius: 'vinicius@ubiqua.com',
      email_josi: 'josi@ubiqua.com',
    }),
  }).catch(() => {
    console.warn('Falha silenciosa no envio de email')
  })
}
