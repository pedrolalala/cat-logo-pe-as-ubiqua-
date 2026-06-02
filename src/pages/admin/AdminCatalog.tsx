import { useState, useEffect } from 'react'
import { useParts, GroupedPart } from '@/hooks/use-parts'
import { PartCard } from '@/components/PartCard'
import {
  updateCatalogItemsGroup,
  updateCatalogOrder,
  deleteCatalogItemGroup,
} from '@/lib/api-admin'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export function AdminCatalog() {
  const { data, loading, refetch } = useParts()
  const [search, setSearch] = useState('')
  const [draggedGroup, setDraggedGroup] = useState<GroupedPart | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [mode, setMode] = useState<'group' | 'reorder'>('group')
  const [orderedData, setOrderedData] = useState<GroupedPart[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: ubData } = await supabase
        .from('usuarios_ubiqua')
        .select('nivel_acesso')
        .eq('id', user.id)
        .single()
      if (ubData?.nivel_acesso === 'admin') {
        setIsAdmin(true)
        return
      }

      const { data: uData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single()
      if (uData?.role === 'admin' || uData?.role === 'gerente') {
        setIsAdmin(true)
      }
    }
    checkRole()
  }, [])

  useEffect(() => {
    if (!search) {
      setOrderedData(data)
    } else {
      const q = search.toLowerCase()
      setOrderedData(data.filter((g) => g.nomeExibicao.toLowerCase().includes(q)))
    }
  }, [data, search])

  const handleDragStart = (e: React.DragEvent, group: GroupedPart, index: number) => {
    setDraggedGroup(group)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', group.id)
    e.dataTransfer.setData('index', index.toString())
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

  const handleDrop = async (e: React.DragEvent, targetGroup: GroupedPart, targetIndex: number) => {
    e.preventDefault()
    setDragOverId(null)

    if (!draggedGroup || draggedGroup.id === targetGroup.id) return

    if (mode === 'group') {
      if (draggedGroup.valorRevenda !== targetGroup.valorRevenda) {
        toast.error('Produtos com preços diferentes não podem ser agrupados.')
        setDraggedGroup(null)
        return
      }

      const itemIds = draggedGroup.detalhesPorCor.map((item) => item.id)
      const targetItem =
        targetGroup.detalhesPorCor.find((item) => item.desc_produto) ||
        targetGroup.detalhesPorCor[0]
      const newDesc = targetItem?.desc_produto || targetItem?.descricao || targetGroup.nomeExibicao

      try {
        await updateCatalogItemsGroup(itemIds, newDesc)
        toast.success('Produtos agrupados com sucesso!')
        refetch()
      } catch (error) {
        toast.error('Erro ao agrupar produtos.')
      }
    } else {
      const sourceIndex = parseInt(e.dataTransfer.getData('index'), 10)
      if (isNaN(sourceIndex)) return

      const newData = [...orderedData]
      newData.splice(sourceIndex, 1)
      newData.splice(targetIndex, 0, draggedGroup)

      setOrderedData(newData)

      try {
        const payload = newData.flatMap((g, i) =>
          g.detalhesPorCor.map((item) => ({ id: item.id, ordem: i })),
        )

        const changedPayload = payload.filter((p) => {
          const oldItem = data.flatMap((g) => g.detalhesPorCor).find((i) => i.id === p.id)
          return oldItem?.ordem !== p.ordem
        })

        if (changedPayload.length > 0) {
          await updateCatalogOrder(changedPayload)
          toast.success('Ordem atualizada com sucesso!')
          refetch()
        }
      } catch (error) {
        toast.error('Erro ao atualizar a ordem.')
        setOrderedData(data) // revert
      }
    }

    setDraggedGroup(null)
  }

  const handleDeleteGroup = async (group: GroupedPart) => {
    try {
      const itemIds = group.detalhesPorCor.map((i) => i.id)
      await deleteCatalogItemGroup(itemIds)
      toast.success('Peça apagada com sucesso!')
      refetch()
    } catch (error: any) {
      if (error.message === 'fk_violation') {
        toast.error(
          'Não é possível apagar esta peça pois ela está vinculada a orçamentos existentes.',
        )
      } else {
        toast.error('Erro ao apagar peça.')
      }
    }
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full max-w-xl">
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-background"
            disabled={mode === 'reorder'}
          />
          <div className="flex items-center space-x-2 shrink-0 bg-background px-3 py-2 rounded-md border">
            <Switch
              id="mode-reorder"
              checked={mode === 'reorder'}
              onCheckedChange={(c) => {
                setMode(c ? 'reorder' : 'group')
                if (c) setSearch('')
              }}
            />
            <Label htmlFor="mode-reorder" className="cursor-pointer">
              Modo Ordenação
            </Label>
          </div>
        </div>
        <p className="text-sm text-muted-foreground flex-1 sm:text-right">
          {mode === 'group'
            ? 'Arraste um produto sobre o outro para agrupá-los.'
            : 'Arraste os produtos para reordenar a listagem pública.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {orderedData.map((group, index) => (
          <div
            key={group.id}
            draggable
            onDragStart={(e) => handleDragStart(e, group, index)}
            onDragOver={(e) => handleDragOver(e, group)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, group, index)}
            onDragEnd={() => {
              setDraggedGroup(null)
              setDragOverId(null)
            }}
            className={cn(
              'transition-all duration-300 cursor-grab active:cursor-grabbing h-full relative',
              mode === 'group' &&
                dragOverId === group.id &&
                'ring-4 ring-orange-500 ring-offset-4 ring-offset-background rounded-xl scale-105 z-10 shadow-xl',
              mode === 'reorder' &&
                dragOverId === group.id &&
                'ring-4 ring-blue-500 ring-offset-4 ring-offset-background rounded-xl scale-105 z-10 shadow-xl opacity-80',
              draggedGroup?.id === group.id && 'opacity-40 grayscale scale-95',
            )}
          >
            <div className="h-full pointer-events-auto relative group/card">
              <PartCard group={group} onAddBudget={() => {}} />
              {isAdmin && mode === 'group' && (
                <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir peça?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja apagar esta peça? Esta ação não pode ser desfeita e
                          removerá o item permanentemente do catálogo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteGroup(group)
                          }}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            {dragOverId === group.id && mode === 'group' && (
              <div className="absolute inset-0 bg-orange-500/10 rounded-xl pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
                <div className="bg-background/90 text-foreground font-bold px-4 py-2 rounded-full shadow-lg border border-orange-200">
                  Solte para Agrupar
                </div>
              </div>
            )}
            {dragOverId === group.id && mode === 'reorder' && (
              <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
                <div className="bg-background/90 text-foreground font-bold px-4 py-2 rounded-full shadow-lg border border-blue-200">
                  Mover para cá
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
