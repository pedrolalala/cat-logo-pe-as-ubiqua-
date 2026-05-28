import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useParts, getVariantImage, colorMap } from '@/hooks/use-parts'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, ImageOff, Tag, Layers, AlertCircle, Check } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QuantityModal } from '@/components/QuantityModal'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlColor = searchParams.get('cor')

  const { data, loading, error } = useParts()

  const group = useMemo(() => data.find((g) => g.slug === slug), [data, slug])

  const uniqueColors = useMemo(() => {
    if (!group) return []
    if (group.coresDisponiveis && group.coresDisponiveis.length > 0) return group.coresDisponiveis
    return ['PADRÃO']
  }, [group])

  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  useEffect(() => {
    if (urlColor) {
      const match = uniqueColors.find((c) => c.toUpperCase() === urlColor.toUpperCase())
      if (match) setSelectedColor(match)
    } else if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0])
    }
  }, [urlColor, uniqueColors, selectedColor])

  const selectedVariant = useMemo(() => {
    if (!group) return null
    if (!selectedColor) return group.detalhesPorCor[0] || null
    const colorVariants = group.detalhesPorCor.filter((v) => {
      const c = v.cor?.toUpperCase().trim() || 'PADRÃO'
      return c === selectedColor.toUpperCase().trim()
    })
    if (colorVariants.length === 0) return group.detalhesPorCor[0] || null
    return colorVariants.reduce((prev, curr) =>
      (curr.disponivel || 0) > (prev.disponivel || 0) ? curr : prev,
    )
  }, [group, selectedColor])

  const [imageError, setImageError] = useState(false)
  const [modalVariant, setModalVariant] = useState<any | null>(null)

  useEffect(() => {
    setImageError(false)
  }, [selectedColor])

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl animate-fade-in">
        <div className="mb-6">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <div className="space-y-6 pt-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-14 w-64 mt-10" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up min-h-[60vh]">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Produto não encontrado</h2>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Não conseguimos encontrar o produto que você está procurando. Ele pode ter sido removido
          ou o link está incorreto.
        </p>
        <Button onClick={() => navigate('/')} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Catálogo
        </Button>
      </div>
    )
  }

  const mappedImageUrl = getVariantImage(selectedVariant, group.imagemPrincipal)
  const displayPrice = selectedVariant?.valor_revenda ?? group.valorRevenda ?? 0
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(displayPrice)

  const lampName = group.nomeExibicao || 'Peça'
  const cleanDescription = selectedVariant?.descricao
    ? selectedVariant.descricao.replace(/-\s*(ISLIGHT|MANOELLA)\s*$/i, '').trim()
    : lampName

  const getVariantStockForColor = (colorName: string) => {
    const colorVariants = group.detalhesPorCor.filter((v) => {
      const c = v.cor?.toUpperCase().trim() || 'PADRÃO'
      return c === colorName.toUpperCase().trim()
    })
    if (colorVariants.length === 0) return 0
    return colorVariants.reduce((sum, curr) => sum + (Number(curr.disponivel) || 0), 0)
  }

  let stockDisplay = ''
  if (selectedColor && selectedVariant) {
    const qty = getVariantStockForColor(selectedColor)
    stockDisplay = `${qty} disponível em ${selectedColor}`
  } else {
    stockDisplay = `${group.totalAvailable || 0} disponível no total`
  }

  const isOutOfStock = selectedColor
    ? getVariantStockForColor(selectedColor) <= 0
    : group.totalAvailable <= 0

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-fade-in pb-24">
      <Button
        variant="ghost"
        className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
        onClick={() => {
          if (location.state?.fromCatalog) {
            navigate(-1)
          } else {
            navigate('/')
          }
        }}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao Catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery Column */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-square bg-white rounded-2xl border overflow-hidden flex items-center justify-center shadow-sm">
            {!imageError && mappedImageUrl ? (
              <img
                src={mappedImageUrl}
                alt={lampName}
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply p-8 transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="w-16 h-16 mb-4 opacity-50" />
                <span className="text-sm font-semibold uppercase tracking-wider opacity-60">
                  Sem Imagem
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge
                variant="secondary"
                className="font-mono font-bold bg-background/90 backdrop-blur-sm shadow-sm text-sm border-none"
              >
                {selectedVariant?.referencia || group.detalhesPorCor[0]?.referencia || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details Column */}
        <div className="flex flex-col">
          <div className="mb-2">
            <Badge
              className={cn(
                'text-xs shadow-sm mb-4 border-none py-1 px-3',
                !isOutOfStock
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-destructive text-destructive-foreground',
              )}
            >
              {isOutOfStock ? 'Sem estoque' : stockDisplay}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground uppercase tracking-tight leading-tight mb-4">
            {lampName}
          </h1>

          <div className="text-4xl font-bold text-orange-600 mb-8 tracking-tight">
            {formattedPrice}
          </div>

          <div className="space-y-8 mb-8 flex-1">
            <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-orange-500" />
                Descrição do Produto
              </h3>
              <p className="text-muted-foreground leading-relaxed">{cleanDescription}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-orange-500" />
                Cores Disponíveis
              </h3>
              {uniqueColors.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((colorName) => {
                    const hex = colorMap[colorName.toUpperCase()] || '#CCCCCC'
                    const isWhite = hex === '#FFFFFF'
                    const qty = getVariantStockForColor(colorName)
                    const isSelected = selectedColor === colorName

                    return (
                      <button
                        key={colorName}
                        onClick={() => {
                          setSelectedColor(colorName)
                          setSearchParams({ cor: colorName }, { replace: true })
                        }}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                          isSelected
                            ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm'
                            : 'border-border hover:border-orange-300 hover:bg-slate-50',
                        )}
                        title={`${qty} disponível`}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center shadow-sm',
                            isWhite && 'border border-slate-300',
                          )}
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <Check
                              className={cn('w-3.5 h-3.5', isWhite ? 'text-black' : 'text-white')}
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium">{colorName}</span>
                        <span className="text-xs text-muted-foreground ml-1">({qty})</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cor Padrão</p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Button
              size="lg"
              className="w-full sm:w-auto text-lg h-14 px-10 bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                const variantToAdd = selectedVariant || group.detalhesPorCor[0]
                if (variantToAdd) setModalVariant(variantToAdd)
              }}
              disabled={!selectedVariant && group.detalhesPorCor.length === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-3" />
              Adicionar ao Orçamento
            </Button>
            <p className="text-sm text-muted-foreground mt-4 text-center sm:text-left">
              * Clique para revisar quantidades e adicionar ao seu orçamento atual.
            </p>
          </div>
        </div>
      </div>

      {modalVariant && (
        <QuantityModal
          part={modalVariant}
          isOpen={!!modalVariant}
          onClose={() => setModalVariant(null)}
        />
      )}
    </div>
  )
}
