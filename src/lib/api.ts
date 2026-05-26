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
  variants?: PartVariant[]
  totalAvailable?: number
  coresDisponiveis?: string[]
  imagemPrincipal?: string | null
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

// `fetchParts` foi preterido em favor do uso direto de `useParts` hook
// mantido por compatibilidade
export async function fetchParts(): Promise<PartGroup[]> {
  const { data: viewResult, error: viewError } = await supabase
    .from('vw_catalogo_unificado' as any)
    .select('*')

  if (viewError) {
    console.error('Error fetching parts:', viewError)
    return []
  }

  const groupsMap = new Map<string, PartGroup>()

  for (const row of viewResult || []) {
    const baseRef = row.referencia_base || ''

    groupsMap.set(baseRef, {
      baseReference: baseRef,
      name: row.nome_exibicao || baseRef,
      totalAvailable: Number(row.estoque_total) || 0,
      coresDisponiveis: row.cores_disponiveis || [],
      imagemPrincipal: row.imagem_principal,
      variants: [],
    })
  }

  return Array.from(groupsMap.values()).sort((a, b) =>
    a.baseReference.localeCompare(b.baseReference),
  )
}
