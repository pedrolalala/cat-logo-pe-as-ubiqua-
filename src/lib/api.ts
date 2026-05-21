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
