import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export type GroupedPart = {
  id: string
  slug: string
  nomeExibicao: string
  totalAvailable: number
  coresDisponiveis: string[]
  imagemPrincipal: string | null
  valorRevenda: number
  detalhesPorCor: any[]
  ordem: number
}

export function getVariantImage(variant: any, fallbackImage: string | null) {
  const getSixDigits = (ref: string | null) => {
    if (!ref) return null
    const match = ref.match(/^[0-9]{6}/)
    if (match) return match[0]
    return null
  }
  const sixDigits = variant ? getSixDigits(variant.referencia) : null
  const storageBaseUrl =
    'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/'

  return (
    variant?.imagem_catalogo_url ||
    variant?.imagem_url ||
    fallbackImage ||
    (sixDigits ? `${storageBaseUrl}${sixDigits}_catalogo.jpg` : null)
  )
}

export const colorMap: Record<string, string> = {
  BRANCA: '#FFFFFF',
  PRETA: '#000000',
  AREIA: '#D2B48C',
  'VERDE SÁLVIA': '#77815C',
  'VERDE SALVIA': '#77815C',
  'OURO VELHO': '#CFB53B',
  PRATA: '#C0C0C0',
  COBRE: '#B87333',
  DOURADA: '#D4AF37',
  DOURADO: '#D4AF37',
  CORTEN: '#B87333',
  NÍQUEL: '#727472',
  NIQUEL: '#727472',
  AMARELA: '#FFFF00',
  AMARELO: '#FFFF00',
  AZUL: '#0000FF',
  VERMELHA: '#FF0000',
  VERMELHO: '#FF0000',
  VERDE: '#008000',
  ROSA: '#FFC0CB',
  LILAS: '#C8A2C8',
  MARROM: '#964B00',
  LARANJA: '#FFA500',
  GRAFITE: '#383428',
  CHUMBO: '#5A5A5A',
}

export function groupCatalogItems(items: any[]): GroupedPart[] {
  const groups = new Map<string, GroupedPart>()

  items.forEach((item) => {
    const desc = (item.desc_produto || item.descricao || 'Sem nome').trim()
    const price = Number(item.valor_revenda) || 0
    const key = `${desc.toLowerCase()}_${price.toFixed(2)}`

    if (!groups.has(key)) {
      const slugBase = desc
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const slug = `${slugBase}-${price.toFixed(2).replace('.', '-')}`

      groups.set(key, {
        id: key,
        slug,
        nomeExibicao: desc,
        totalAvailable: 0,
        coresDisponiveis: [],
        imagemPrincipal: null,
        valorRevenda: price,
        detalhesPorCor: [],
        ordem: item.ordem ?? 999999,
      })
    }

    const group = groups.get(key)!
    group.totalAvailable += Number(item.disponivel) || 0

    const cor = (item.cor || 'PADRÃO').trim()
    if (!group.coresDisponiveis.includes(cor)) {
      group.coresDisponiveis.push(cor)
    }

    if (item.imagem_catalogo_url && !group.imagemPrincipal) {
      group.imagemPrincipal = item.imagem_catalogo_url
    }

    if (item.ordem !== null && item.ordem < group.ordem) {
      group.ordem = item.ordem
    }

    group.detalhesPorCor.push(item)
  })

  return Array.from(groups.values()).sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem
    return a.nomeExibicao.localeCompare(b.nomeExibicao)
  })
}

export function useParts() {
  const [data, setData] = useState<GroupedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: items, error: fetchError } = await supabase
        .from('revenda_ubiqua')
        .select('*')
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('id', { ascending: false })

      if (fetchError) throw fetchError

      const grouped = groupCatalogItems(items || [])
      setData(grouped)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('revenda_ubiqua_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenda_ubiqua' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { data, loading, error, refetch: load }
}
