import { useState, useMemo } from 'react'
import { useParts, GroupedPart } from '@/hooks/use-parts'
import { PartCard } from '@/components/PartCard'
import { updateCatalogItemsGroup } from '@/lib/api-admin'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function AdminCatalog() {
  const { data, loading, refetch } = useParts()
  const [search, setSearch] = useState('')
  const [draggedGroup, setDraggedGroup] = useState<GroupedPart | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const filteredData = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((g) => g.nomeExibicao.toLowerCase().includes(q))
  }, [data, search])

  const handleDragStart = (e: React.DragEvent, group: GroupedPart) => {
    setDraggedGroup(group)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', group.id)
  }

  const handleDragOver = (e: React.DragEvent, group: GroupedPart) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedGroup && draggedGroup.id !== group.id) {
      setDragOverId(group.id)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetGroup: GroupedPart) => {
    e.preventDefault()
    setDragOverId(null)

    if (!draggedGroup || draggedGroup.id === targetGroup.id) return

    if (draggedGroup.valorRevenda !== targetGroup.valorRevenda) {
      toast.error('Produtos com preços diferentes não podem ser agrupados.')
      setDraggedGroup(null)
      return
    }

    const itemIds = draggedGroup.detalhesPorCor.map((item) => item.id)
    const targetItem =
      targetGroup.detalhesPorCor.find((item) => item.desc_produto) || targetGroup.detalhesPorCor[0]
    const newDesc = targetItem?.desc_produto || targetItem?.descricao || targetGroup.nomeExibicao

    try {
      await updateCatalogItemsGroup(itemIds, newDesc)
      toast.success('Produtos agrupados com sucesso!')
      refetch()
    } catch (error) {
      toast.error('Erro ao agrupar produtos.')
    }

    setDraggedGroup(null)
  }

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
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-muted/20 p-4 rounded-lg border border-border/50">
        <Input
          placeholder="Buscar produtos para agrupar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-background"
        />
        <p className="text-sm text-muted-foreground">
          Arraste um produto sobre o outro para agrupá-los. Apenas produtos com o mesmo preço podem
          ser mesclados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {filteredData.map((group) => (
          <div
            key={group.id}
            draggable
            onDragStart={(e) => handleDragStart(e, group)}
            onDragOver={(e) => handleDragOver(e, group)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, group)}
            className={cn(
              'transition-all duration-300 cursor-grab active:cursor-grabbing h-full relative',
              dragOverId === group.id &&
                'ring-4 ring-orange-500 ring-offset-4 ring-offset-background rounded-xl scale-105 z-10 shadow-xl',
              draggedGroup?.id === group.id && 'opacity-40 grayscale scale-95',
            )}
          >
            <div className="h-full pointer-events-auto">
              <PartCard group={group} onAddBudget={() => {}} />
            </div>
            {dragOverId === group.id && (
              <div className="absolute inset-0 bg-orange-500/10 rounded-xl pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
                <div className="bg-background/90 text-foreground font-bold px-4 py-2 rounded-full shadow-lg border border-orange-200">
                  Solte para Agrupar
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
