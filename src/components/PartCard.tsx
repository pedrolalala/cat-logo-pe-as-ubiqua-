import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GroupedPart, getVariantImage, colorMap } from '@/hooks/use-parts'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ImageOff } from 'lucide-react'
import { cn, getFinishColorHex } from '@/lib/utils'

interface PartCardProps {
  group: GroupedPart
  onAddBudget: (variant: any) => void
}

export function PartCard({ group, onAddBudget }: PartCardProps) {
  const navigate = useNavigate()
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

  useEffect(() => {
    setImageError(false)
  }, [selectedColor])

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

  const lampName = nomeExibicao || 'Peça'

  const cleanDescription = selectedVariant?.descricao
    ? selectedVariant.descricao.replace(/-\s*(ISLIGHT|MANOELLA)\s*$/i, '').trim()
    : lampName

  const mappedImageUrl = getVariantImage(selectedVariant, imagemPrincipal)

  const getVariantStockForColor = (colorName: string) => {
    const colorVariants = detalhesPorCor.filter((v) => {
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
    stockDisplay = `${totalAvailable || 0} disponível`
  }

  const isOutOfStock = selectedColor
    ? getVariantStockForColor(selectedColor) <= 0
    : totalAvailable <= 0

  const handleViewDetails = () => {
    const state = { fromCatalog: true }
    if (selectedColor && selectedColor !== 'PADRÃO') {
      navigate(`/produto/${group.slug}?cor=${encodeURIComponent(selectedColor)}`, { state })
    } else {
      navigate(`/produto/${group.slug}`, { state })
    }
  }

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group bg-card overflow-hidden border-orange-200/50 hover:border-orange-500/30">
      <div
        className="relative w-full pt-[80%] bg-white overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={handleViewDetails}
      >
        {!imageError && mappedImageUrl ? (
          <img
            src={mappedImageUrl}
            alt={lampName}
            draggable={false}
            onError={() => setImageError(true)}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-105 p-4"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <ImageOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
              Sem Imagem
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          <Badge
            variant="secondary"
            className="font-mono font-bold text-xs bg-background/90 backdrop-blur-sm text-foreground shadow-sm"
          >
            {selectedVariant?.referencia || detalhesPorCor[0]?.referencia || 'N/A'}
          </Badge>
          <Badge
            className={cn(
              'text-xs shadow-sm opacity-90 backdrop-blur-sm border-none',
              !isOutOfStock
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-destructive text-destructive-foreground',
            )}
          >
            {isOutOfStock ? 'Não tem aquela peça em estoque' : stockDisplay}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2 pt-4 cursor-pointer" onClick={handleViewDetails}>
        <h3
          className="font-extrabold text-foreground text-xl leading-tight line-clamp-1 uppercase tracking-tight group-hover:text-orange-600 transition-colors"
          title={lampName}
        >
          {lampName}
        </h3>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pb-4">
        <p
          className="text-sm text-muted-foreground line-clamp-2 cursor-pointer"
          title={cleanDescription}
          onClick={handleViewDetails}
        >
          {cleanDescription}
        </p>

        {uniqueColors.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {uniqueColors.map((colorName) => {
              const hex = getFinishColorHex(colorName, colorMap)
              const isLightColor = hex === '#FFFFFF' || hex === '#F2F2F2'
              const qty = getVariantStockForColor(colorName)
              return (
                <button
                  key={colorName}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all shadow-sm ring-offset-background',
                    isLightColor ? 'border border-gray-200' : 'border border-transparent',
                    selectedColor === colorName
                      ? 'ring-2 ring-orange-500 ring-offset-2 scale-110 shadow-md'
                      : 'opacity-80 hover:opacity-100 hover:scale-105',
                  )}
                  style={{ backgroundColor: hex }}
                  title={`${colorName} - ${qty} disponível`}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedColor(selectedColor === colorName ? null : colorName)
                  }}
                />
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <p className="text-2xl font-bold text-orange-600">{formattedPrice}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button
          className={cn(
            'w-full shadow-sm transition-transform active:scale-95 text-white',
            !isOutOfStock
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed opacity-50',
          )}
          onClick={() => {
            if (isOutOfStock) return
            const variantToAdd = selectedVariant || detalhesPorCor[0]
            if (variantToAdd) onAddBudget(variantToAdd)
          }}
          disabled={(!selectedVariant && detalhesPorCor.length === 0) || isOutOfStock}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isOutOfStock ? 'Não tem aquela peça em estoque' : 'Adicionar ao Orçamento'}
        </Button>
      </CardFooter>
    </Card>
  )
}
