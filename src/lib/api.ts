import { supabase } from '@/lib/supabase/client'

export interface PartVariant {
  id: number
  referencia: string
  descricao: string
  valor_revenda: number
  disponivel: number
  estoque: number
  imagem_catalogo_url: string | null
  cor: string | null
  empresa_id: string | null
  baseName?: string
}

export interface PartGroup {
  baseReference: string
  name: string
  variants: PartVariant[]
}

export interface QuoteData {
  id: string
  numero_orcamento?: string
  valor_total: number
  observacoes: string
  items: any[]
}

export async function saveClienteInfo(data: {
  nome: string
  email: string
  telefone: string
  cpf_cnpj: string
  data_nascimento?: string
}): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from('informacoes_cliente_ubiqua')
    .select('id')
    .eq('email', data.email)
    .maybeSingle()

  if (existing) {
    await supabase.from('informacoes_cliente_ubiqua').update(data).eq('id', existing.id)
    return existing
  }

  const { data: inserted, error } = await supabase
    .from('informacoes_cliente_ubiqua')
    .insert(data)
    .select('id')
    .single()

  if (error) {
    console.error('Error saving client info:', error)
    throw error
  }

  return inserted
}

export async function saveQuoteToSupabase(quoteData: any): Promise<QuoteData> {
  let cliente_id = quoteData.informacoes_cliente_id

  if (!cliente_id) {
    throw new Error('Cliente ID é obrigatório para gerar o orçamento.')
  }

  const { data: orcamento, error: orcError } = await supabase
    .from('orcamentos_revenda_ubiqua')
    .insert({
      cliente_id: cliente_id,
      valor_subtotal: quoteData.valor_total,
      valor_total: quoteData.valor_total,
      status: 'rascunho',
      observacoes: quoteData.observacoes,
    })
    .select()
    .single()

  if (orcError) {
    console.error('Error saving orcamento:', orcError)
    throw orcError
  }

  if (quoteData.items && quoteData.items.length > 0) {
    const itensToInsert = quoteData.items.map((item: any, idx: number) => ({
      orcamento_id: orcamento.id,
      produto_id: item.id, // ID from revenda_ubiqua
      quantidade: item.quantity,
      valor_unitario: item.valor_revenda,
      valor_total: item.valor_revenda * item.quantity,
      referencia_snapshot: item.referencia,
      descricao_snapshot: item.descricao,
      ordem: idx,
    }))

    const { error: itemsError } = await supabase
      .from('itens_orcamento_ubiqua')
      .insert(itensToInsert)

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

export async function fetchParts(): Promise<PartGroup[]> {
  const { data: empresas } = await supabase.from('empresas').select('id, nome')
  const islight = empresas?.find((e) => e.nome.toLowerCase().includes('islight'))?.id
  const manoella = empresas?.find(
    (e) => e.nome.toLowerCase().includes('manoella') || e.nome.toLowerCase().includes('lucenera'),
  )?.id

  const { data, error } = await supabase
    .from('revenda_ubiqua')
    .select(
      'id, referencia, descricao, valor_revenda, disponivel, estoque, imagem_catalogo_url, cor, empresa_id',
    )
    .order('referencia', { ascending: true })

  if (error) {
    console.error('Error fetching parts:', error)
    return []
  }

  const grouped = new Map<string, PartGroup>()

  for (const part of data || []) {
    const baseReference = part.referencia.replace(/-IS$/i, '').trim()
    const name = extractBaseName(part.descricao)

    let empId = part.empresa_id
    if (!empId) {
      empId = part.referencia.toUpperCase().endsWith('-IS') ? islight : manoella
    }

    const variant: PartVariant = {
      ...part,
      empresa_id: empId || null,
      baseName: name,
      disponivel: part.disponivel || 0,
      estoque: part.estoque || 0,
    }

    if (!grouped.has(baseReference)) {
      grouped.set(baseReference, {
        baseReference,
        name,
        variants: [variant],
      })
    } else {
      grouped.get(baseReference)!.variants.push(variant)
    }
  }

  for (const group of grouped.values()) {
    const colorMap = new Map<string, PartVariant>()
    for (const v of group.variants) {
      const color = v.cor?.toUpperCase().trim() || 'PADRÃO'
      const existing = colorMap.get(color)
      if (!existing || (v.disponivel || 0) > (existing.disponivel || 0)) {
        colorMap.set(color, v)
      }
    }
    group.variants = Array.from(colorMap.values())
  }

  return Array.from(grouped.values()).sort((a, b) => a.baseReference.localeCompare(b.baseReference))
}
