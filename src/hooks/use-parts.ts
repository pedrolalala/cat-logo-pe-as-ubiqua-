import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export type GroupedPart = {
  nomeExibicao: string
  totalAvailable: number
  coresDisponiveis: string[]
  imagemPrincipal: string | null
  valorRevenda: number
  detalhesPorCor: any[]
}

export function useParts() {
  const [data, setData] = useState<GroupedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [viewResult, orderResult] = await Promise.all([
        supabase.from('vw_catalogo_ubiqua').select('*'),
        supabase.from('revenda_ubiqua').select('descricao, desc_produto, ordem'),
      ])

      if (viewResult.error) throw viewResult.error

      const orderMap = new Map<string, number>()
      if (!orderResult.error && orderResult.data) {
        orderResult.data.forEach((item) => {
          const currentOrder = item.ordem || 0
          const updateMap = (key: string) => {
            const lower = key.toLowerCase()
            const existing = orderMap.get(lower) ?? 999999
            if (currentOrder < existing) {
              orderMap.set(lower, currentOrder)
            }
          }
          if (item.desc_produto) updateMap(item.desc_produto)
          if (item.descricao) updateMap(item.descricao)
        })
      }

      const mappedData: (GroupedPart & { ordem: number })[] = (viewResult.data || []).map((row) => {
        const nomeExibicao = row.nome_exibicao || 'Sem nome'
        const ordem = orderMap.get(nomeExibicao.toLowerCase()) ?? 999999

        return {
          nomeExibicao,
          totalAvailable: Number(row.estoque_total) || 0,
          coresDisponiveis: row.cores_disponiveis || [],
          imagemPrincipal: row.imagem_principal,
          valorRevenda: Number(row.valor_revenda) || 0,
          detalhesPorCor: (row.detalhes_por_cor as any[]) || [],
          ordem,
        }
      })

      setData(
        mappedData.sort((a, b) => {
          if (a.ordem !== b.ordem) return a.ordem - b.ordem
          return a.nomeExibicao.localeCompare(b.nomeExibicao)
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
