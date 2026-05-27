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

      const viewResult = await supabase.from('vw_catalogo_ubiqua').select('*')

      if (viewResult.error) throw viewResult.error

      const groupsMap = new Map<string, GroupedPart>()

      for (const row of viewResult.data || []) {
        const nome = row.nome_exibicao || 'Sem nome'
        groupsMap.set(nome, {
          nomeExibicao: nome,
          totalAvailable: Number(row.estoque_total) || 0,
          coresDisponiveis: row.cores_disponiveis || [],
          imagemPrincipal: row.imagem_principal,
          valorRevenda: Number(row.valor_revenda) || 0,
          detalhesPorCor: (row.detalhes_por_cor as any[]) || [],
        })
      }

      setData(
        Array.from(groupsMap.values()).sort((a, b) => a.nomeExibicao.localeCompare(b.nomeExibicao)),
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
