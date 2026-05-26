import { useSearchParams } from 'react-router-dom'
import { useParts } from '@/hooks/use-parts'
import { PartCard } from '@/components/PartCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, PackageSearch } from 'lucide-react'
import { useState, useMemo } from 'react'
import { QuantityModal } from '@/components/QuantityModal'
import { PartVariant } from '@/lib/api'

export default function Index() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.toLowerCase() || ''
  const { data, loading, error, refetch } = useParts()
  const [selectedVariant, setSelectedVariant] = useState<PartVariant | null>(null)

  const filteredData = useMemo(() => {
    if (!query) return data
    return data.filter((group) => {
      return (
        group.baseReference.toLowerCase().includes(query) ||
        group.name.toLowerCase().includes(query)
      )
    })
  }, [data, query])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 flex flex-col gap-4 shadow-sm animate-pulse"
          >
            <Skeleton className="h-6 w-1/3 rounded-full" />
            <Skeleton className="h-5 w-full mt-2" />
            <Skeleton className="h-5 w-2/3" />
            <div className="mt-auto pt-6 flex flex-col gap-3">
              <Skeleton className="h-8 w-1/2" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Ops! Algo deu errado.</h2>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Ocorreu um erro ao carregar o catálogo. Por favor, tente novamente.
        </p>
        <Button onClick={refetch} size="lg">
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <PackageSearch className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">Nenhuma peça encontrada</h2>
        <p className="text-muted-foreground max-w-md text-lg">
          Não encontramos nenhum resultado para{' '}
          <span className="font-semibold text-foreground">"{query}"</span>. Tente buscar por outros
          termos de referência ou descrição.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredData.map((group, i) => (
          <div
            key={group.baseReference}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <PartCard group={group} onAddBudget={(variant) => setSelectedVariant(variant)} />
          </div>
        ))}
      </div>

      <QuantityModal
        part={selectedVariant as any}
        isOpen={!!selectedVariant}
        onClose={() => setSelectedVariant(null)}
      />
    </div>
  )
}
