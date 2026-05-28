import { supabase } from '@/lib/supabase/client'

export interface QuoteItem {
  produto_id?: number
  referencia_snapshot?: string
  descricao_snapshot?: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  referencia?: string
  descricao?: string
  preco_unitario?: number
  subtotal?: number
  empresa?: string
}

export interface Quote {
  id: string
  numero_orcamento?: string
  empresa?: string
  faturamento?: string
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

    return data?.role === 'admin' || data?.role === 'gerente'
  } catch {
    return false
  }
}

export interface CatalogItem {
  id: number
  referencia: string
  descricao: string
  desc_produto: string | null
  imagem_catalogo_url: string | null
  ordem: number
}

export async function fetchCatalogItems(search: string = ''): Promise<CatalogItem[]> {
  let query = supabase
    .from('revenda_ubiqua')
    .select('id, referencia, descricao, desc_produto, imagem_catalogo_url, ordem')
    .limit(1000)
  if (search) {
    query = query.or(
      `referencia.ilike.%${search}%,descricao.ilike.%${search}%,desc_produto.ilike.%${search}%`,
    )
  }
  const { data, error } = await query
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('id', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []) as CatalogItem[]
}

export async function updateCatalogOrder(items: { id: number; ordem: number }[]) {
  const { error } = await supabase.rpc('update_revenda_ubiqua_ordem', { payload: items })
  if (error) throw error
}

export async function uploadCatalogImage(file: File, filePrefix: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const fileName = `${filePrefix}_${Date.now()}.${ext}`
  const filePath = `catalogos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('revenda-ubiqua-images')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from('revenda-ubiqua-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function updateCatalogImageUrl(id: number, url: string | null) {
  const { error } = await supabase
    .from('revenda_ubiqua')
    .update({
      imagem_catalogo_url: url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function updateCatalogImageUrlByReferencia(referencia: string, url: string | null) {
  const { error } = await supabase
    .from('revenda_ubiqua')
    .update({
      imagem_catalogo_url: url,
      updated_at: new Date().toISOString(),
    })
    .eq('referencia', referencia)

  if (error) {
    throw error
  }
}

export async function uploadCatalogImageExact(file: File, referencia: string): Promise<string> {
  const filePath = `catalogos/${referencia}_catalogo.jpg`

  const { error: uploadError } = await supabase.storage
    .from('revenda-ubiqua-images')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from('revenda-ubiqua-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function fetchQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('orcamentos_revenda_ubiqua')
    .select(`
      id,
      numero_orcamento,
      created_at,
      valor_total,
      status,
      cliente:informacoes_cliente_ubiqua(nome),
      itens:itens_orcamento_ubiqua(
        produto:revenda_ubiqua(
          empresa:empresas(nome)
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((q: any) => {
    const companies = new Set<string>()
    if (Array.isArray(q.itens)) {
      q.itens.forEach((i: any) => {
        let empName = i.produto?.empresa?.nome
        if (!empName) {
          const ref = i.referencia_snapshot || ''
          empName = ref.toUpperCase().endsWith('-IS') ? 'Islight' : 'Manoella'
        }
        if (empName) companies.add(empName)
      })
    }
    const faturamento = Array.from(companies).join(', ') || 'Não especificado'

    return {
      id: q.id,
      numero_orcamento: q.numero_orcamento,
      empresa: q.cliente?.nome || 'Cliente não informado',
      faturamento,
      created_at: q.created_at,
      data_criacao: q.created_at,
      valor_total: q.valor_total,
      status: q.status,
      items: (q.itens || []).map((i: any) => {
        let empName = i.produto?.empresa?.nome
        if (!empName) {
          const ref = i.referencia_snapshot || ''
          empName = ref.toUpperCase().endsWith('-IS') ? 'Islight' : 'Manoella'
        }
        return {
          produto_id: i.produto_id,
          referencia_snapshot: i.referencia_snapshot,
          descricao_snapshot: i.descricao_snapshot,
          referencia: i.referencia_snapshot || '',
          descricao: i.descricao_snapshot || '',
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario,
          valor_total: i.valor_total,
          preco_unitario: i.valor_unitario,
          subtotal: i.valor_total,
          empresa: empName,
        }
      }),
    } as Quote
  })
}

export async function approvePurchase(quoteId: string) {
  try {
    const { error: updateError } = await supabase
      .from('orcamentos_revenda_ubiqua')
      .update({
        status: 'aprovado',
        aprovado_em: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (updateError) throw updateError

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
