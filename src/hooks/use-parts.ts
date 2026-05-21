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

      // Consolidation Logic: group products by name/description
      const groupedMap = new Map<string, Part>()

      parts.forEach((part) => {
        const groupKey = part.baseName || (part.descricao ? part.descricao.split(' ')[0] : 'Peça')

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, { ...part, baseName: groupKey })
        } else {
          const existing = groupedMap.get(groupKey)!

          // Sum stock and availability
          if (part.estoque !== undefined) {
            existing.estoque = (existing.estoque || 0) + part.estoque
          }
          if (part.disponivel !== undefined) {
            existing.disponivel = (existing.disponivel || 0) + part.disponivel
          }

          // Ensure primary reference image takes precedence
          if (!existing.imagem_catalogo_url && part.imagem_catalogo_url) {
            existing.imagem_catalogo_url = part.imagem_catalogo_url
            existing.referencia = part.referencia
            if ('cod_produto' in part) {
              ;(existing as any).cod_produto = (part as any).cod_produto
            }
          }
        }
      })

      setData(Array.from(groupedMap.values()))
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
