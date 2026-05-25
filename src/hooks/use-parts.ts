import { useState, useEffect, useCallback } from 'react'
import { PartGroup, PartVariant } from '@/lib/api'
import { supabase } from '@/lib/supabase/client'

export function useParts() {
  const [data, setData] = useState<PartGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: records, error: fetchError } = await supabase
        .from('revenda_ubiqua')
        .select('*')
        .order('referencia', { ascending: true })

      if (fetchError) throw fetchError

      const groupsMap = new Map<string, PartGroup>()

      for (const record of records || []) {
        const rawRef = record.referencia || ''
        const baseReference = rawRef.toUpperCase().replace(/-IS$/, '')

        if (!groupsMap.has(baseReference)) {
          groupsMap.set(baseReference, {
            baseReference,
            name: record.descricao || 'Peça',
            variants: [],
          })
        }

        groupsMap.get(baseReference)!.variants.push({
          ...record,
          referencia_base: baseReference,
        } as unknown as PartVariant)
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
