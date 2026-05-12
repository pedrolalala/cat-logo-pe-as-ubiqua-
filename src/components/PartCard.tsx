import { Part } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, ShoppingCart } from 'lucide-react'

interface PartCardProps {
  part: Part
  onAddBudget: () => void
}

export function PartCard({ part, onAddBudget }: PartCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(part.valor_revenda)

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 group bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge
            variant="secondary"
            className="font-mono font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
          >
            {part.referencia}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2">
        <h3
          className="font-semibold text-foreground text-lg leading-tight line-clamp-2"
          title={part.descricao}
        >
          {part.descricao}
        </h3>
        <p className="text-2xl font-bold text-primary mt-auto pt-2">{formattedPrice}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-0">
        <Button
          variant="default"
          className="w-full shadow-sm transition-transform active:scale-95"
          onClick={onAddBudget}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Adicionar ao Orçamento
        </Button>
        <Button
          variant="outline"
          className="w-full text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
          asChild
        >
          <a href={part.url_produto} target="_blank" rel="noopener noreferrer">
            Ver no site
            <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
