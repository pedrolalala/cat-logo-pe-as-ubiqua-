import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export type GroupedPart = {
  baseReference: string
  name: string
  totalAvailable: number
  coresDisponiveis: string[]
  imagemPrincipal: string | null
  valorMinimo: number
}

export function useParts() {
  const [data, setData] = useState<GroupedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const viewResult = await supabase.from('vw_catalogo_unificado').select('*')

      if (viewResult.error) throw viewResult.error

      const groupsMap = new Map<string, GroupedPart>()

      for (const row of viewResult.data || []) {
        const baseRef = row.referencia_base || ''

        groupsMap.set(baseRef, {
          baseReference: baseRef,
          name: row.nome_exibicao || baseRef,
          totalAvailable: Number(row.estoque_total) || 0,
          coresDisponiveis: row.cores_disponiveis || [],
          imagemPrincipal: row.imagem_principal,
          valorMinimo: Number(row.valor_minimo) || 0,
        })
      }

      setData(
        Array.from(groupsMap.values()).sort((a, b) =>
          a.baseReference.localeCompare(b.baseReference),
        ),
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
