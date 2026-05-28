import { useEffect, useState } from 'react'
import {
  fetchCatalogItems,
  updateCatalogOrder,
  updateCatalogImageUrl,
  uploadCatalogImage,
  updateCatalogItemDetails,
  createCatalogItem,
  CatalogItem,
} from '@/lib/api-admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  Search,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Edit,
  Plus,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function AdminImages() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploadingId, setUploadingId] = useState<number | null>(null)

  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formState, setFormState] = useState({ referencia: '', descricao: '', cor: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  const loadItems = async (q: string = '') => {
    setLoading(true)
    try {
      const data = await fetchCatalogItems(q)
      setItems(data)
    } catch (error) {
      toast.error('Erro ao carregar itens do catálogo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      loadItems(search)
    }, 500)
    return () => clearTimeout(delay)
  }, [search])

  const handleFileUpload = async (id: number, file: File) => {
    try {
      setUploadingId(id)
      const item = items.find((i) => i.id === id)
      const prefix = item?.referencia || `item_${id}`
      const url = await uploadCatalogImage(file, prefix)
      await updateCatalogImageUrl(id, url)
      toast.success('Imagem atualizada com sucesso')
      loadItems(search)
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem')
    } finally {
      setUploadingId(null)
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    if (swapIndex < 0 || swapIndex >= newItems.length) return

    const tempOrder = newItems[index].ordem
    newItems[index].ordem = newItems[swapIndex].ordem
    newItems[swapIndex].ordem = tempOrder

    const tempItem = newItems[index]
    newItems[index] = newItems[swapIndex]
    newItems[swapIndex] = tempItem

    setItems(newItems)

    try {
      await updateCatalogOrder([
        { id: newItems[index].id, ordem: newItems[index].ordem },
        { id: newItems[swapIndex].id, ordem: newItems[swapIndex].ordem },
      ])
    } catch (error) {
      toast.error('Erro ao atualizar a ordem')
      loadItems(search)
    }
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    try {
      if (isCreating) {
        if (!formState.referencia || !formState.descricao) {
          toast.error('Preencha os campos obrigatórios (Referência e Descrição)')
          setSavingEdit(false)
          return
        }
        await createCatalogItem({
          referencia: formState.referencia,
          descricao: formState.descricao,
          desc_produto: formState.descricao,
          cor: formState.cor,
          ordem: items.length > 0 ? items[0].ordem - 1 : 0,
        })
        toast.success('Produto criado com sucesso!')
      } else if (editingItem) {
        await updateCatalogItemDetails(editingItem.id, {
          cor: formState.cor,
          referencia: formState.referencia,
          descricao: formState.descricao,
          desc_produto: formState.descricao,
        })
        toast.success('Produto atualizado com sucesso!')
      }
      setIsCreating(false)
      setEditingItem(null)
      loadItems(search)
    } catch (error) {
      toast.error('Erro ao salvar o produto')
    } finally {
      setSavingEdit(false)
    }
  }

  const openEdit = (item: CatalogItem) => {
    setEditingItem(item)
    setIsCreating(false)
    setFormState({
      referencia: item.referencia || '',
      descricao: item.desc_produto || item.descricao || '',
      cor: item.cor || '',
    })
  }

  const openCreate = () => {
    setEditingItem(null)
    setIsCreating(true)
    setFormState({ referencia: '', descricao: '', cor: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por referência ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Button onClick={openCreate} className="shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg border border-dashed text-center space-y-2">
          <p className="text-muted-foreground font-medium">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <Card
              key={item.id}
              className="overflow-hidden flex flex-col group border-orange-200/50 hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="aspect-square bg-white relative">
                {item.imagem_catalogo_url ? (
                  <img
                    src={item.imagem_catalogo_url}
                    alt={item.descricao}
                    className="w-full h-full object-contain mix-blend-multiply p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-sm font-medium uppercase tracking-wider opacity-60">
                      Sem Imagem
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                    <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors shadow-sm">
                      {uploadingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="font-medium">Alterar Imagem</span>
                    </div>
                  </Label>
                  <Input
                    id={`upload-${item.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(item.id, file)
                    }}
                  />
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1" title={item.referencia}>
                  {item.referencia}
                </CardTitle>
                <div
                  className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]"
                  title={item.desc_produto || item.descricao}
                >
                  {item.desc_produto || item.descricao}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <Badge
                    variant={item.cor ? 'default' : 'secondary'}
                    className={item.cor ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    {item.cor ? `Cor: ${item.cor}` : 'Sem cor'}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    Ordem: {item.ordem}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between bg-slate-50/50 border-t items-center mt-auto h-14">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(item)}
                  className="hover:text-orange-600 hover:bg-orange-100/50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:border-orange-500 hover:text-orange-600"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, 'up')}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:border-orange-500 hover:text-orange-600"
                    disabled={index === items.length - 1}
                    onClick={() => handleMoveOrder(index, 'down')}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isCreating || !!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setEditingItem(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Novo Produto' : 'Editar Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="referencia">
                Referência <span className="text-destructive">*</span>
              </Label>
              <Input
                id="referencia"
                value={formState.referencia}
                onChange={(e) => setFormState((prev) => ({ ...prev, referencia: e.target.value }))}
                placeholder="Ex: IS-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descricao"
                value={formState.descricao}
                onChange={(e) => setFormState((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: LUMINÁRIA PENDENTE..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                value={formState.cor}
                onChange={(e) => setFormState((prev) => ({ ...prev, cor: e.target.value }))}
                placeholder="Ex: BRANCA, PRETA, DOURADA..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Opcional. Adicione a cor do produto para facilitar a organização.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setEditingItem(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
