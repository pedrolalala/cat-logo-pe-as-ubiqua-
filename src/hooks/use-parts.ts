import { useState, useEffect, useCallback } from 'react'
import { PartVariant } from '@/lib/api'
import { supabase } from '@/lib/supabase/client'

export type GroupedPart = {
  baseReference: string
  name: string
  totalAvailable: number
  coresDisponiveis: string[]
  imagemPrincipal: string | null
  variants: PartVariant[]
}

export function useParts() {
  const [data, setData] = useState<GroupedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [viewResult, variantsResult] = await Promise.all([
        supabase.from('vw_catalogo_unificado').select('*'),
        supabase.from('revenda_ubiqua').select('*'),
      ])

      if (viewResult.error) throw viewResult.error
      if (variantsResult.error) throw variantsResult.error

      const variantsByBaseRef = new Map<string, PartVariant[]>()
      for (const row of variantsResult.data || []) {
        const baseReference = (row.referencia || '').replace(/-IS$/i, '').trim()
        if (!variantsByBaseRef.has(baseReference)) {
          variantsByBaseRef.set(baseReference, [])
        }
        variantsByBaseRef.get(baseReference)!.push(row as PartVariant)
      }

      const groupsMap = new Map<string, GroupedPart>()

      // Add items from the view
      for (const row of viewResult.data || []) {
        const baseRef = row.referencia_base || ''
        const variants = variantsByBaseRef.get(baseRef) || []

        groupsMap.set(baseRef, {
          baseReference: baseRef,
          name: row.nome_exibicao || baseRef,
          totalAvailable: Number(row.estoque_total) || 0,
          coresDisponiveis: row.cores_disponiveis || [],
          imagemPrincipal: row.imagem_principal,
          variants,
        })
      }

      // Add fallback for variants not in the view (safety check)
      for (const [baseRef, variants] of variantsByBaseRef.entries()) {
        if (!groupsMap.has(baseRef) && variants.length > 0) {
          let name = variants[0].descricao || baseRef
          name = name.replace(/-\s*(ISLIGHT|MANOELLA)\s*$/i, '').trim()

          groupsMap.set(baseRef, {
            baseReference: baseRef,
            name,
            totalAvailable: variants.reduce((sum, v) => sum + (v.disponivel || 0), 0),
            coresDisponiveis: Array.from(
              new Set(variants.map((v) => v.cor?.toUpperCase().trim() || 'PADRÃO')),
            ),
            imagemPrincipal:
              variants.find((v) => v.imagem_catalogo_url)?.imagem_catalogo_url || null,
            variants,
          })
        }
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
