import { supabase } from '@/lib/supabase/client'

export interface Part {
  id: number
  referencia: string
  descricao: string
  valor_revenda: number
  disponivel: number
  imagem_catalogo_url?: string | null
}

export async function saveQuoteToSupabase(quoteData: any): Promise<any> {
  const { data, error } = await supabase.from('quotes').insert(quoteData).select().single()

  if (error) {
    console.error('Error saving quote:', error)
    throw error
  }

  return data
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

export async function fetchParts(): Promise<Part[]> {
  const { data, error } = await supabase
    .from('revenda_ubiqua')
    .select('id, referencia, descricao, valor_revenda, disponivel, imagem_catalogo_url')
    .order('referencia', { ascending: true })

  if (error) {
    console.error('Error fetching parts:', error)
    return []
  }

  return (data || []) as Part[]
}
