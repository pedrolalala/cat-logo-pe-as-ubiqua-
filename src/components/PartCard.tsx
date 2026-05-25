import { useState, useEffect, useMemo, useCallback } from 'react'
import { PartGroup, PartVariant } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PartCardProps {
  group: PartGroup
  onAddBudget: (variant: PartVariant) => void
}

export function PartCard({ group, onAddBudget }: PartCardProps) {
  const variantsByColor = useMemo(() => {
    const map = new Map<string, PartVariant[]>()
    for (const v of group.variants) {
      const color = v.cor?.toUpperCase().trim() || 'PADRÃO'
      if (!map.has(color)) {
        map.set(color, [])
      }
      map.get(color)!.push(v)
    }
    return map
  }, [group.variants])

  const uniqueColors = Array.from(variantsByColor.keys())

  const getBestVariantForColor = useCallback(
    (color: string) => {
      const variants = variantsByColor.get(color) || []
      if (variants.length === 0) return group.variants[0]

      return variants.reduce((prev, current) => {
        const prevDisp = prev.disponivel || 0
        const currDisp = current.disponivel || 0
        return currDisp > prevDisp ? current : prev
      })
    },
    [variantsByColor, group.variants],
  )

  const bestInitialVariant = useMemo(() => {
    if (group.variants.length === 0) return null
    return group.variants.reduce((prev, current) => {
      const prevDisp = prev.disponivel || 0
      const currDisp = current.disponivel || 0
      return currDisp > prevDisp ? current : prev
    })
  }, [group.variants])

  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return bestInitialVariant?.cor?.toUpperCase().trim() || 'PADRÃO'
  })

  const selectedVariant = useMemo(() => {
    return getBestVariantForColor(selectedColor) || group.variants[0]
  }, [selectedColor, getBestVariantForColor, group.variants])

  const colorOptions = useMemo(() => {
    return uniqueColors.map((color) => ({
      colorName: color,
      bestVariant: getBestVariantForColor(color),
    }))
  }, [uniqueColors, getBestVariantForColor])

  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [selectedVariant])

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(selectedVariant.valor_revenda || 0)

  const lampName = group.name || 'Peça'

  const getSixDigits = (p: PartVariant) => {
    const codProd = (p as any).cod_produto
    if (codProd) {
      const codStr = String(codProd)
      if (codStr.length >= 6) return codStr.substring(0, 6)
    }
    if (p.referencia) {
      const match = p.referencia.match(/^[0-9]{6}/)
      if (match) return match[0]
    }
    return null
  }

  const sixDigits = getSixDigits(selectedVariant)

  const storageBaseUrl =
    'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/'
  const mappedImageUrl =
    selectedVariant.imagem_catalogo_url ||
    (sixDigits ? `${storageBaseUrl}${sixDigits}_catalogo.jpg` : null)

  const colorMap: Record<string, string> = {
    BRANCA: '#FFFFFF',
    PRETA: '#000000',
    AREIA: '#D2B48C',
    'VERDE SÁLVIA': '#77815C',
    'VERMELHO CHAMA': '#E25822',
  }

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group bg-card overflow-hidden border-orange-200/50 hover:border-orange-500/30">
      <div className="relative w-full pt-[80%] bg-white overflow-hidden flex items-center justify-center">
        {!imageError && mappedImageUrl ? (
          <img
            src={mappedImageUrl}
            alt={lampName}
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
            {group.baseReference}
          </Badge>
          {selectedVariant.disponivel !== undefined && (
            <Badge
              className={`text-xs shadow-sm opacity-90 backdrop-blur-sm border-none ${selectedVariant.disponivel > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-destructive text-destructive-foreground'}`}
            >
              {selectedVariant.disponivel > 0
                ? `${selectedVariant.disponivel} disponível`
                : 'Sem estoque'}
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-2 pt-4">
        <h3
          className="font-extrabold text-foreground text-xl leading-tight line-clamp-1 uppercase tracking-tight"
          title={lampName}
        >
          {lampName}
        </h3>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2" title={selectedVariant.descricao}>
          {selectedVariant.descricao}
        </p>

        {colorOptions.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {colorOptions.map((opt) => {
              const colorName = opt.colorName
              const hex = colorMap[colorName] || '#CCCCCC'
              const isWhite = hex === '#FFFFFF'
              return (
                <button
                  key={colorName}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all shadow-sm ring-offset-background',
                    isWhite ? 'border border-slate-300' : 'border border-transparent',
                    selectedColor === colorName
                      ? 'ring-2 ring-orange-500 ring-offset-2 scale-110 shadow-md'
                      : 'opacity-80 hover:opacity-100 hover:scale-105',
                  )}
                  style={{ backgroundColor: hex }}
                  title={colorName}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedColor(colorName)
                  }}
                />
              )
            })}
          </div>
        )}

        <p className="text-2xl font-bold text-orange-600 mt-2">{formattedPrice}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button
          className="w-full shadow-sm transition-transform active:scale-95 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => onAddBudget(selectedVariant)}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar ao Orçamento
        </Button>
      </CardFooter>
    </Card>
  )
}
