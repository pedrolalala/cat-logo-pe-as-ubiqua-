import { useState } from 'react'
import { Part } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ImageOff } from 'lucide-react'

interface PartCardProps {
  part: Part
  onAddBudget: () => void
}

export function PartCard({ part, onAddBudget }: PartCardProps) {
  const [imageError, setImageError] = useState(false)

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(part.valor_revenda || 0)

  const lampName = part.baseName || part.descricao.split(' ')[0] || 'Peça'

  // Dynamic Image Mapping: maps to the storage bucket folder 'catalogos' using the first 6 digits
  const getSixDigits = (p: Part) => {
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

  const sixDigits = getSixDigits(part)

  const storageBaseUrl =
    'https://vcvcwzmbiftcawncibke.supabase.co/storage/v1/object/public/revenda-ubiqua-images/catalogos/'
  const mappedImageUrl =
    part.imagem_catalogo_url || (sixDigits ? `${storageBaseUrl}${sixDigits}_catalogo.jpg` : null)

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
            {part.referencia}
          </Badge>
          {part.disponivel !== undefined && (
            <Badge
              className={`text-xs shadow-sm opacity-90 backdrop-blur-sm border-none ${part.disponivel > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-destructive text-destructive-foreground'}`}
            >
              {part.disponivel > 0 ? `${part.disponivel} disponível` : 'Sem estoque'}
            </Badge>
          )}
          {part.estoque !== undefined && (
            <Badge
              variant="outline"
              className="text-xs shadow-sm opacity-90 backdrop-blur-sm bg-background/80"
            >
              Estoque total: {part.estoque}
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
      <CardContent className="flex-1 flex flex-col gap-1 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2" title={part.descricao}>
          {part.descricao}
        </p>
        <p className="text-2xl font-bold text-orange-600 mt-auto pt-3">{formattedPrice}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button
          className="w-full shadow-sm transition-transform active:scale-95 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={onAddBudget}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar ao Orçamento
        </Button>
      </CardFooter>
    </Card>
  )
}
