import { supabase } from '@/lib/supabase/client'

export interface Part {
  id: number
  referencia: string
  descricao: string
  valor_revenda: number
  disponivel: number
  estoque?: number
  imagem_catalogo_url?: string | null
  baseName?: string
}

export async function saveClienteInfo(data: {
  nome: string
  email: string
  telefone: string
  data_nascimento: string
}): Promise<void> {
  const { error } = await supabase.from('informacoes_cliente_ubiqua').insert(data)
  if (error) {
    console.error('Error saving client info:', error)
    throw error
  }
}

export async function saveQuoteToSupabase(quoteData: any): Promise<any> {
  const { data: empresa } = await supabase.from('empresas').select('id').limit(1).single()

  if (!empresa) {
    throw new Error('Nenhuma empresa encontrada para associar ao orçamento.')
  }

  let observacoesFinal = quoteData.observacoes || ''
  if (quoteData.nome_cliente) {
    observacoesFinal = `Lead (Website): ${quoteData.nome_cliente}\n\n${observacoesFinal}`
  }

  const { data: orcamento, error: orcError } = await supabase
    .from('orcamentos')
    .insert({
      empresa_id: empresa.id,
      observacoes: observacoesFinal,
      valor_total: quoteData.valor_total,
      status: 'Rascunho',
      data_emissao: new Date().toISOString(),
    })
    .select()
    .single()

  if (orcError) {
    console.error('Error saving orcamento:', orcError)
    throw orcError
  }

  if (quoteData.items && quoteData.items.length > 0) {
    const itensToInsert = quoteData.items.map((item: any) => ({
      orcamento_id: orcamento.id,
      descricao: item.descricao,
      quantidade: item.quantity,
      preco_unitario: item.valor_revenda,
      custom_id: item.referencia,
    }))

    const { error: itemsError } = await supabase.from('orcamento_itens').insert(itensToInsert)

    if (itemsError) {
      console.error('Error saving orcamento_itens:', itemsError)
      throw itemsError
    }
  }

  return {
    ...orcamento,
    items: quoteData.items,
  }
}

export async function sendQuoteEmail(payload: any): Promise<void> {
  const { error } = await supabase.functions.invoke('enviar-confirmacao-email', {
    body: payload,
  })

  if (error) {
    console.error('Error sending quote email:', error)
    throw error
  }
}

const extractBaseName = (desc: string) => {
  if (!desc) return 'PEÇA'
  let d = desc.toUpperCase()
  d = d.replace(/^IS\s*-\s*/, '')

  const targets = [
    'PLISSE',
    'BLOK',
    'STANDY',
    'TWIGGY',
    'GOOD NIGHT',
    'ZOOM DESK',
    'CRYSTAL',
    'FLORA',
    'CUBOX',
    'TORUS DESK',
  ]

  for (const t of targets) {
    if (d.includes(t)) return t
  }

  const match = d.match(/^([A-Z0-9\s]+?)\s+(?:LUM|LED|MINI|LUMIN|DE)/)
  if (match && match[1]) {
    return match[1].trim()
  }
  const words = d.split(' ')
  return words.slice(0, 2).join(' ')
}

export async function fetchParts(): Promise<Part[]> {
  const { data, error } = await supabase
    .from('revenda_ubiqua')
    .select('id, referencia, descricao, valor_revenda, disponivel, estoque, imagem_catalogo_url')
    .order('referencia', { ascending: true })

  if (error) {
    console.error('Error fetching parts:', error)
    return []
  }

  const grouped = new Map<string, Part>()

  for (const part of data || []) {
    const baseName = extractBaseName(part.descricao)

    if (grouped.has(baseName)) {
      const existing = grouped.get(baseName)!
      existing.disponivel += part.disponivel || 0
      existing.estoque = (existing.estoque || 0) + (part.estoque || 0)
      if (
        part.valor_revenda > 0 &&
        (existing.valor_revenda === 0 || part.valor_revenda < existing.valor_revenda)
      ) {
        existing.valor_revenda = part.valor_revenda
      }
    } else {
      grouped.set(baseName, {
        ...part,
        estoque: part.estoque || 0,
        disponivel: part.disponivel || 0,
        baseName,
      })
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    (a.baseName || '').localeCompare(b.baseName || ''),
  )
}
