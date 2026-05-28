import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Search,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Files,
  GripVertical,
} from 'lucide-react'
import {
  fetchCatalogItems,
  uploadCatalogImage,
  updateCatalogImageUrl,
  updateCatalogImageUrlByReferencia,
  uploadCatalogImageExact,
  updateCatalogOrder,
  CatalogItem,
} from '@/lib/api-admin'
import { cn } from '@/lib/utils'

export function AdminImages() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const [draggedItem, setDraggedItem] = useState<CatalogItem | null>(null)

  const loadItems = async (q: string = '') => {
    setLoading(true)
    try {
      const data = await fetchCatalogItems(q)
      setItems(data)
    } catch (error) {
      toast.error('Erro ao buscar itens do catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadItems(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleUploadClick = (item: CatalogItem) => {
    setSelectedItem(item)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedItem) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Formato de arquivo inválido. Use JPG, PNG ou WEBP.')
      return
    }

    setUploadingId(selectedItem.id)
    try {
      const safeReferencia = selectedItem.referencia.replace(/[^a-zA-Z0-9-]/g, '')
      const url = await uploadCatalogImageExact(file, safeReferencia)
      await updateCatalogImageUrl(selectedItem.id, `${url}?t=${Date.now()}`)
      toast.success('Imagem enviada com sucesso!')
      loadItems(search)
    } catch (error) {
      toast.error('Erro ao enviar imagem.')
      console.error(error)
    } finally {
      setUploadingId(null)
      setSelectedItem(null)
    }
  }

  const handleRemoveImage = async (id: number) => {
    setUploadingId(id)
    try {
      await updateCatalogImageUrl(id, null)
      toast.success('Imagem removida com sucesso!')
      loadItems(search)
    } catch (error) {
      toast.error('Erro ao remover imagem.')
    } finally {
      setUploadingId(null)
    }
  }

  const handleBatchUploadClick = () => {
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = ''
      batchFileInputRef.current.click()
    }
  }

  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsBatchUploading(true)
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        errorCount++
        continue
      }

      const match = file.name.match(/^([A-Za-z0-9-]+)/)
      if (!match) {
        errorCount++
        continue
      }

      const referencia = match[1]

      try {
        const url = await uploadCatalogImageExact(file, referencia)
        await updateCatalogImageUrlByReferencia(referencia, `${url}?t=${Date.now()}`)
        successCount++
      } catch (error) {
        console.error('Error uploading batch file', file.name, error)
        errorCount++
      }
    }

    setIsBatchUploading(false)
    if (successCount > 0) {
      toast.success(`Upload em lote concluído! ${successCount} imagens enviadas.`)
      loadItems(search)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} arquivo(s) falharam no upload. Verifique os formatos e nomes.`)
    }
  }

  const handleDragStart = (e: React.DragEvent, item: CatalogItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    const dragGhost = e.currentTarget.cloneNode(true) as HTMLElement
    dragGhost.style.opacity = '0.5'
    document.body.appendChild(dragGhost)
    e.dataTransfer.setDragImage(dragGhost, 20, 20)
    setTimeout(() => document.body.removeChild(dragGhost), 0)
  }

  const handleDragOver = (e: React.DragEvent, targetItem: CatalogItem) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return

    setItems((prev) => {
      const newItems = [...prev]
      const draggedIndex = newItems.findIndex((i) => i.id === draggedItem.id)
      const targetIndex = newItems.findIndex((i) => i.id === targetItem.id)

      if (draggedIndex === -1 || targetIndex === -1) return prev

      newItems.splice(draggedIndex, 1)
      newItems.splice(targetIndex, 0, draggedItem)
      return newItems
    })
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem) return
    setDraggedItem(null)

    setSavingOrder(true)
    try {
      const orderPayload = items.map((it, idx) => ({ id: it.id, ordem: idx + 1 }))
      await updateCatalogOrder(orderPayload)
      toast.success('Ordem salva com sucesso!')
    } catch (err) {
      toast.error('Erro ao salvar a nova ordem.')
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por referência ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            onClick={handleBatchUploadClick}
            disabled={isBatchUploading || loading}
            className="w-full sm:w-auto shrink-0"
          >
            {isBatchUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Files className="w-4 h-4 mr-2" />
            )}
            {isBatchUploading ? 'Enviando Lote...' : 'Upload em Lote'}
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp"
      />
      <input
        type="file"
        ref={batchFileInputRef}
        onChange={handleBatchFileChange}
        className="hidden"
        multiple
        accept=".jpg,.jpeg,.png,.webp"
      />

      <div className="bg-card border rounded-md p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 border rounded-md">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center h-32 flex items-center justify-center text-muted-foreground">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDrop={handleDrop}
                onDragEnd={() => setDraggedItem(null)}
                className={cn(
                  'relative group flex flex-col gap-3 p-4 border rounded-md bg-background shadow-sm hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing',
                  draggedItem?.id === item.id ? 'opacity-50' : 'opacity-100',
                )}
              >
                <div className="absolute top-2 left-2 p-1 bg-background/80 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10 text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="aspect-square relative w-full rounded-md overflow-hidden bg-muted flex items-center justify-center border">
                  {item.imagem_catalogo_url ? (
                    <img
                      src={item.imagem_catalogo_url}
                      alt={item.referencia}
                      className="object-cover w-full h-full pointer-events-none"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30 pointer-events-none" />
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm truncate" title={item.referencia}>
                    {item.referencia}
                  </h3>
                  <p
                    className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1"
                    title={item.desc_produto || item.descricao}
                  >
                    {item.desc_produto || item.descricao || '-'}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => handleUploadClick(item)}
                    disabled={uploadingId === item.id}
                  >
                    {uploadingId === item.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Upload
                  </Button>

                  {item.imagem_catalogo_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveImage(item.id)}
                      disabled={uploadingId === item.id}
                      title="Remover Imagem"
                    >
                      {uploadingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {savingOrder && (
        <div className="fixed bottom-4 right-4 bg-background border shadow-lg rounded-md px-4 py-2 flex items-center gap-2 z-50 animate-fade-in-up">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Salvando nova ordem...</span>
        </div>
      )}
    </div>
  )
}
