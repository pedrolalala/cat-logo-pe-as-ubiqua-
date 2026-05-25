import { useState, useEffect } from 'react'
import { PartGroup, PartVariant } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ImageOff, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PartCardProps {
  group: PartGroup
  onAddBudget: (variant: PartVariant) => void
}

export function PartCard({ group, onAddBudget }: PartCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<PartVariant>(group.variants[0])
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

  const companyName = selectedVariant.referencia.toUpperCase().endsWith('-IS')
    ? 'Islight'
    : 'Manoella'

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
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border shadow-sm">
          <Building2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-foreground">{companyName}</span>
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

        {group.variants.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {group.variants.map((v) => {
              const colorName = v.cor?.toUpperCase().trim() || 'PADRÃO'
              const hex = colorMap[colorName] || '#CCCCCC'
              return (
                <button
                  key={v.id}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all shadow-sm',
                    selectedVariant.id === v.id
                      ? 'border-orange-500 scale-110 shadow-md'
                      : 'border-transparent opacity-80 hover:opacity-100',
                  )}
                  style={{ backgroundColor: hex }}
                  title={v.cor || 'Padrão'}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedVariant(v)
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
