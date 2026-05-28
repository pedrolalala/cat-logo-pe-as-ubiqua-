import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export type GroupedPart = {
  id: string
  nomeExibicao: string
  totalAvailable: number
  coresDisponiveis: string[]
  imagemPrincipal: string | null
  valorRevenda: number
  detalhesPorCor: any[]
  ordem: number
}

export function groupCatalogItems(items: any[]): GroupedPart[] {
  const groups = new Map<string, GroupedPart>()

  items.forEach((item) => {
    const desc = (item.desc_produto || item.descricao || 'Sem nome').trim()
    const price = Number(item.valor_revenda) || 0
    const key = `${desc.toLowerCase()}_${price.toFixed(2)}`

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
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
