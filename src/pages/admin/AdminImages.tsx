import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Search, Upload, Trash2, Image as ImageIcon, Loader2, Files } from 'lucide-react'
import {
  fetchCatalogItems,
  uploadCatalogImage,
  updateCatalogImageUrl,
  updateCatalogImageUrlByReferencia,
  uploadCatalogImageExact,
  CatalogItem,
} from '@/lib/api-admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AdminImages() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [isBatchUploading, setIsBatchUploading] = useState(false)

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

      // Expected pattern: [referencia]_catalogo.jpg or just starts with [referencia]
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

  return (
    <div className="space-y-4 animate-fade-in">
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

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-12 w-12 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imagem_catalogo_url ? (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                        <img
                          src={item.imagem_catalogo_url}
                          alt={item.referencia}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.referencia}</TableCell>
                  <TableCell
                    className="max-w-[400px] truncate"
                    title={item.desc_produto || item.descricao}
                  >
                    {item.desc_produto || item.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadClick(item)}
                        disabled={uploadingId === item.id}
                      >
                        {uploadingId === item.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload
                      </Button>
                      {item.imagem_catalogo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
