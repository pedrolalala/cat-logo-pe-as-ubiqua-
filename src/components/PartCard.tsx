import { useState, useEffect, useMemo } from 'react'
import { PartVariant } from '@/lib/api'
import { GroupedPart } from '@/hooks/use-parts'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ImageOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface PartCardProps {
  group: GroupedPart
  onAddBudget: (variant: PartVariant) => void
}

export function PartCard({ group, onAddBudget }: PartCardProps) {
  const {
    coresDisponiveis,
    imagemPrincipal,
    totalAvailable,
    name,
    baseReference,
    valorMinimo,
    detalhesPorCor,
  } = group

  const uniqueColors = useMemo(() => {
    if (coresDisponiveis && coresDisponiveis.length > 0) return coresDisponiveis
    return ['PADRÃO']
  }, [coresDisponiveis])

  const [selectedColor, setSelectedColor] = useState<string | null>(() =>
    uniqueColors.length === 1 ? uniqueColors[0] : null,
  )
  const [allVariants, setAllVariants] = useState<any[]>(detalhesPorCor || [])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (detalhesPorCor && detalhesPorCor.length > 0) {
      setAllVariants(detalhesPorCor)
      return
    }

    let isMounted = true
    async function fetchVariants() {
      setLoadingVariants(true)
      const { data } = await supabase
        .from('revenda_ubiqua')
        .select(
          'id, referencia, descricao, valor_revenda, cor, disponivel, imagem_catalogo_url, empresa:empresas!fk_empresa(nome)',
        )
        .or(
          `referencia.eq.${baseReference},referencia.eq.${baseReference}-IS,referencia.ilike.${baseReference} -%`,
        )

      if (isMounted && data) {
        const mappedData = data.map((v) => {
          const emp = Array.isArray(v.empresa) ? v.empresa[0] : v.empresa
          return {
            ...v,
            empresa: emp?.nome || 'Não informada',
          }
        })
        setAllVariants(mappedData)
      }
      if (isMounted) setLoadingVariants(false)
    }

    fetchVariants()
    return () => {
      isMounted = false
    }
  }, [baseReference, detalhesPorCor])

  const selectedVariant = useMemo(() => {
    if (!selectedColor) return null
    const colorVariants = allVariants.filter((v) => {
      const c = v.cor?.toUpperCase().trim() || 'PADRÃO'
      return c === selectedColor.toUpperCase().trim()
    })

    if (colorVariants.length === 0) return null

    return colorVariants.reduce((prev, curr) =>
      (curr.disponivel || 0) > (prev.disponivel || 0) ? curr : prev,
    )
  }, [selectedColor, allVariants])

  useEffect(() => {
    setImageError(false)
  }, [selectedVariant])

  const displayPrice = selectedVariant?.valor_revenda ?? valorMinimo ?? 0
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(displayPrice)

  const lampName = name || baseReference || 'Peça'

  const cleanDescription = selectedVariant?.descricao
    ? selectedVariant.descricao.replace(/-\s*(ISLIGHT|MANOELLA)\s*$/i, '').trim()
    : lampName

  const getSixDigits = (ref: string | null) => {
    if (!ref) return null
    const match = ref.match(/^[0-9]{6}/)
    if (match) return match[0]
    return null
  }

  const sixDigits = selectedVariant
    ? getSixDigits(selectedVariant.referencia)
    : getSixDigits(baseReference)

  const storageBaseUrl =
    'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/'

  const mappedImageUrl =
    selectedVariant?.imagem_catalogo_url ||
    (sixDigits ? `${storageBaseUrl}${sixDigits}_catalogo.jpg` : null) ||
    imagemPrincipal

  const colorMap: Record<string, string> = {
    BRANCA: '#FFFFFF',
    PRETA: '#000000',
    AREIA: '#D2B48C',
    'VERDE SÁLVIA': '#77815C',
  }

  const getVariantStockForColor = (colorName: string) => {
    const colorVariants = allVariants.filter((v) => {
      const c = v.cor?.toUpperCase().trim() || 'PADRÃO'
      return c === colorName.toUpperCase().trim()
    })
    if (colorVariants.length === 0) return 0
    return colorVariants.reduce((sum, curr) => sum + (curr.disponivel || 0), 0)
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
            {baseReference}
          </Badge>
          <Badge
            className={cn(
              'text-xs shadow-sm opacity-90 backdrop-blur-sm border-none',
              !isOutOfStock
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-destructive text-destructive-foreground',
            )}
          >
            {isOutOfStock ? 'Sem estoque' : stockDisplay}
          </Badge>
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
        <p className="text-sm text-muted-foreground line-clamp-2" title={cleanDescription}>
          {cleanDescription}
        </p>

        {uniqueColors.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {uniqueColors.map((colorName) => {
              const hex = colorMap[colorName.toUpperCase()] || '#CCCCCC'
              const isWhite = hex === '#FFFFFF'
              const qty = getVariantStockForColor(colorName)
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
          {loadingVariants && <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button
          className="w-full shadow-sm transition-transform active:scale-95 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => selectedVariant && onAddBudget(selectedVariant)}
          disabled={!selectedVariant || loadingVariants}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar ao Orçamento
        </Button>
      </CardFooter>
    </Card>
  )
}
