import { useState, useMemo, useRef } from 'react'
import { useParts, GroupedPart } from '@/hooks/use-parts'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ImageOff, Upload, Save, Edit, RefreshCw, Search, AlertCircle, Trash2 } from 'lucide-react'
import {
  updateCatalogItemDetails,
  updateCatalogImageUrl,
  uploadCatalogImageExact,
  deleteCatalogImage,
} from '@/lib/api-admin'
import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  BRANCA: '#FFFFFF',
  PRETA: '#000000',
  AREIA: '#D2B48C',
  'VERDE SÁLVIA': '#77815C',
  'VERDE SALVIA': '#77815C',
  'OURO VELHO': '#CFB53B',
  PRATA: '#C0C0C0',
  COBRE: '#B87333',
  DOURADA: '#D4AF37',
  DOURADO: '#D4AF37',
  CORTEN: '#B87333',
  NÍQUEL: '#727472',
  NIQUEL: '#727472',
  AMARELA: '#FFFF00',
  AMARELO: '#FFFF00',
  AZUL: '#0000FF',
  VERMELHA: '#FF0000',
  VERMELHO: '#FF0000',
  VERDE: '#008000',
  ROSA: '#FFC0CB',
  LILAS: '#C8A2C8',
  MARROM: '#964B00',
  LARANJA: '#FFA500',
  GRAFITE: '#383428',
  CHUMBO: '#5A5A5A',
}

function AdminPartCard({
  group,
  onEdit,
}: {
  group: GroupedPart
  onEdit: (g: GroupedPart, v: any) => void
}) {
  const {
    coresDisponiveis,
    imagemPrincipal,
    totalAvailable,
    nomeExibicao,
    valorRevenda,
    detalhesPorCor,
  } = group

  const uniqueColors = useMemo(() => {
    if (coresDisponiveis && coresDisponiveis.length > 0) return coresDisponiveis
    return ['PADRÃO']
  }, [coresDisponiveis])

  const [selectedColor, setSelectedColor] = useState<string | null>(() =>
    uniqueColors.length === 1 ? uniqueColors[0] : null,
  )
  const [imageError, setImageError] = useState(false)

  const selectedVariant = useMemo(() => {
    if (!selectedColor) return detalhesPorCor[0] || null
    const colorVariants = detalhesPorCor.filter((v) => {
      const c = v.cor?.toUpperCase().trim() || 'PADRÃO'
      return c === selectedColor.toUpperCase().trim()
    })
    if (colorVariants.length === 0) return detalhesPorCor[0] || null
    return colorVariants.reduce((prev, curr) =>
      (curr.disponivel || 0) > (prev.disponivel || 0) ? curr : prev,
    )
  }, [selectedColor, detalhesPorCor])

  const displayPrice = selectedVariant?.valor_revenda ?? valorRevenda ?? 0
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(displayPrice)

  const mappedImageUrl = selectedVariant?.imagem_catalogo_url || imagemPrincipal

  return (
    <Card className="flex flex-col h-full bg-card overflow-hidden border-border/50 hover:border-primary/30 transition-all">
      <div className="relative w-full pt-[80%] bg-white overflow-hidden flex items-center justify-center">
        {!imageError && mappedImageUrl ? (
          <img
            src={mappedImageUrl}
            alt={nomeExibicao}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-contain p-4 mix-blend-multiply"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <ImageOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Sem Imagem</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge
            variant="secondary"
            className="font-mono font-bold text-xs bg-background/90 backdrop-blur-sm text-foreground"
          >
            {selectedVariant?.referencia || 'N/A'}
          </Badge>
          <Badge className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-none">
            {detalhesPorCor.length} Variante{detalhesPorCor.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2 pt-4">
        <h3
          className="font-extrabold text-foreground text-sm line-clamp-2 uppercase"
          title={nomeExibicao}
        >
          {nomeExibicao}
        </h3>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pb-4">
        {uniqueColors.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map((colorName) => {
              const hex = colorMap[colorName.toUpperCase()] || '#CCCCCC'
              const isWhite = hex === '#FFFFFF'
              return (
                <button
                  key={colorName}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all shadow-sm ring-offset-background',
                    isWhite ? 'border border-slate-300' : 'border border-transparent',
                    selectedColor === colorName
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'opacity-80 hover:opacity-100',
                  )}
                  style={{ backgroundColor: hex }}
                  title={colorName}
                  onClick={() => {
                    setSelectedColor(colorName)
                    setImageError(false)
                  }}
                />
              )
            })}
          </div>
        )}
        <p className="text-xl font-bold text-primary mt-auto">{formattedPrice}</p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => selectedVariant && onEdit(group, selectedVariant)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar Variante
        </Button>
      </CardFooter>
    </Card>
  )
}

export function AdminImages() {
  const { data, loading, refetch } = useParts()
  const [search, setSearch] = useState('')
  const [editingVariant, setEditingVariant] = useState<any>(null)
  const [editingGroup, setEditingGroup] = useState<GroupedPart | null>(null)

  const [descProduto, setDescProduto] = useState('')
  const [valorRevenda, setValorRevenda] = useState<number>(0)
  const [cor, setCor] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const lowerSearch = search.toLowerCase()
    return data.filter(
      (g) =>
        g.nomeExibicao.toLowerCase().includes(lowerSearch) ||
        g.detalhesPorCor.some((v) => v.referencia?.toLowerCase().includes(lowerSearch)),
    )
  }, [data, search])

  const handleEdit = (group: GroupedPart, variant: any) => {
    setEditingGroup(group)
    setEditingVariant(variant)
    setDescProduto(variant.desc_produto || variant.descricao || '')
    setValorRevenda(Number(variant.valor_revenda) || 0)
    setCor(variant.cor || '')
  }

  const handleSave = async () => {
    if (!editingVariant) return
    setIsSaving(true)
    try {
      await updateCatalogItemDetails(editingVariant.id, {
        desc_produto: descProduto,
        valor_revenda: valorRevenda,
        cor: cor,
      })
      toast.success('Variante atualizada com sucesso.')
      setEditingVariant(null)
      refetch()
    } catch (error) {
      toast.error('Erro ao atualizar variante.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingVariant) return
    setIsSaving(true)
    try {
      const url = await uploadCatalogImageExact(file, editingVariant.referencia)
      await updateCatalogImageUrl(editingVariant.id, url)
      toast.success('Imagem enviada com sucesso!')
      setEditingVariant(null)
      refetch()
    } catch (error) {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!editingVariant?.imagem_catalogo_url) return
    if (!confirm('Tem certeza que deseja excluir esta imagem? A ação não pode ser desfeita.'))
      return

    setIsSaving(true)
    try {
      await deleteCatalogImage(editingVariant.id, editingVariant.imagem_catalogo_url)
      toast.success('Imagem removida com sucesso!')
      setEditingVariant({ ...editingVariant, imagem_catalogo_url: null })
      refetch()
    } catch (error) {
      toast.error('Erro ao remover imagem.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou referência..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-80 rounded-xl animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/10">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground font-medium">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredData.map((group) => (
            <AdminPartCard key={group.id} group={group} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <Dialog open={!!editingVariant} onOpenChange={(o) => !o && setEditingVariant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Variante: {editingVariant?.referencia}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição do Produto (Agrupamento)</Label>
              <Input value={descProduto} onChange={(e) => setDescProduto(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">
                Itens com a mesma descrição e preço são agrupados.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Valor Revenda (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorRevenda}
                onChange={(e) => setValorRevenda(parseFloat(e.target.value))}
              />
              <p className="text-[11px] font-medium text-orange-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                Alterar o valor separará esta variante em um novo card.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="Ex: BRANCA, PRETA..."
              />
            </div>
            <div className="space-y-2 pt-2 border-t mt-4">
              <Label>Imagem do Catálogo</Label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {editingVariant?.imagem_catalogo_url ? (
                  <div className="w-16 h-16 border rounded bg-white p-1 relative group">
                    <img
                      src={editingVariant.imagem_catalogo_url}
                      alt="Current"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 border rounded bg-muted flex items-center justify-center">
                    <ImageOff className="w-6 h-6 text-muted-foreground opacity-50" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" /> Alterar Imagem
                    </Button>
                    {editingVariant?.imagem_catalogo_url && (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteImage}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remover
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2">
                    A imagem enviada será usada para esta variante e servirá de base (fallback) para
                    outras variantes do mesmo grupo que não possuam imagem.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVariant(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
