import { supabase } from '@/lib/supabase/client'

export interface Part {
  id: number
  referencia: string
  descricao: string
  valor_revenda: number
  disponivel: number
  imagem_catalogo_url?: string | null
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
