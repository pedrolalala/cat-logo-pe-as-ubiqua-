import { Part } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

interface PartCardProps {
  part: Part
  onAddBudget: () => void
}

export function PartCard({ part, onAddBudget }: PartCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(part.valor_revenda || 0)

  // Extrair nome da luminária
  const extractName = (desc: string) => {
    if (!desc) return 'Peça'
    const match = desc.match(/^(?:IS\s*-\s*)?([A-Z0-9\s]+?)\s+(?:LUM|LED|MINI|LUMIN)/i)
    if (match && match[1]) {
      return match[1].trim()
    }
    const words = desc.split(' ')
    return words.slice(0, 2).join(' ')
  }

  const lampName = extractName(part.descricao)

  // Imagem de referência ou fallback
  const imageUrl =
    part.imagem_catalogo_url ||
    `https://img.usecurling.com/p/400/400?q=${encodeURIComponent(lampName + ' lamp')}&color=orange`

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group bg-card overflow-hidden border-border/50">
      <div className="relative w-full pt-[80%] bg-muted/20 overflow-hidden">
        <img
          src={imageUrl}
          alt={lampName}
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          <Badge
            variant="secondary"
            className="font-mono font-bold text-xs bg-background/90 backdrop-blur-sm text-foreground shadow-sm"
          >
            {part.referencia}
          </Badge>
          {part.disponivel !== undefined && (
            <Badge
              variant={part.disponivel > 0 ? 'default' : 'destructive'}
              className="text-xs shadow-sm opacity-90 backdrop-blur-sm"
            >
              {part.disponivel > 0 ? `${part.disponivel} em estoque` : 'Sem estoque'}
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
        <p className="text-2xl font-bold text-primary mt-auto pt-3">{formattedPrice}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button
          variant="default"
          className="w-full shadow-sm transition-transform active:scale-95"
          onClick={onAddBudget}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar ao Orçamento
        </Button>
      </CardFooter>
    </Card>
  )
}
