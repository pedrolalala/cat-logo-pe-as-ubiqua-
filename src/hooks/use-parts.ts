import { useState, useEffect, useCallback } from 'react'
import { PartGroup, PartVariant } from '@/lib/api'
import { supabase } from '@/lib/supabase/client'

export type GroupedPart = PartGroup & { totalAvailable?: number }

export function useParts() {
  const [data, setData] = useState<GroupedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: rows, error: supabaseError } = await supabase
        .from('revenda_ubiqua')
        .select('*')
        .order('referencia')

      if (supabaseError) throw supabaseError

      const groupsMap = new Map<string, GroupedPart>()

      for (const row of rows || []) {
        // Normalization: Remove '-IS' suffix if present to group effectively
        const baseReference = (row.referencia || '').replace(/-IS$/i, '').trim()

        if (!groupsMap.has(baseReference)) {
          let name = row.desc_produto || row.descricao || baseReference

          // Clean up color from the name if possible to make it unified
          const color = (row.cor || '').toUpperCase().trim()
          if (color && name.toUpperCase().includes(color)) {
            name = name.replace(new RegExp(`\\s*-?\\s*${color}\\b`, 'i'), '').trim()
          }

          // Company-Agnostic UI: Remove ISLIGHT / MANOELLA from the name
          name = name.replace(/-\s*(ISLIGHT|MANOELLA)\s*$/i, '').trim()

          groupsMap.set(baseReference, {
            baseReference,
            name: name,
            variants: [],
            totalAvailable: 0,
          } as GroupedPart)
        }

        const group = groupsMap.get(baseReference)!
        group.variants.push(row as PartVariant)
        // Unified Stock Display: Sum disponivel across all grouped variants
        group.totalAvailable = (group.totalAvailable || 0) + (row.disponivel || 0)
      }

      setData(Array.from(groupsMap.values()))
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
