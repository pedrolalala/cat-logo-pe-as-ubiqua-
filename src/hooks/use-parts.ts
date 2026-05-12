import { useState, useEffect, useCallback } from 'react'
import { fetchParts, Part } from '@/lib/api'

export function useParts() {
  const [data, setData] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const parts = await fetchParts()
      setData(parts)
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
