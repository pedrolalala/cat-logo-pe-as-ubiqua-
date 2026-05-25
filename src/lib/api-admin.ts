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
}

export async function fetchCatalogItems(search: string = ''): Promise<CatalogItem[]> {
  let query = supabase
    .from('revenda_ubiqua')
    .select('id, referencia, descricao, desc_produto, imagem_catalogo_url')
    .limit(50)
  if (search) {
    query = query.or(
      `referencia.ilike.%${search}%,descricao.ilike.%${search}%,desc_produto.ilike.%${search}%`,
    )
  }
  const { data, error } = await query.order('id', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []) as CatalogItem[]
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
