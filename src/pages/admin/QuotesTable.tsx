import { Quote } from '@/lib/api-admin'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Data indisponível'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateString
  }
}

interface QuotesTableProps {
  quotes: Quote[]
  onSelectQuote: (quote: Quote) => void
}

export function QuotesTable({ quotes, onSelectQuote }: QuotesTableProps) {
  return (
    <div className="border rounded-md bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID / Empresa</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow
              key={quote.id}
              className={cn(
                'transition-colors',
                quote.status === 'aberto' && 'cursor-pointer hover:bg-muted/50',
              )}
              onClick={() => quote.status === 'aberto' && onSelectQuote(quote)}
            >
              <TableCell>
                <div className="font-medium">{quote.empresa || 'Empresa não informada'}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                  #{quote.id}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(quote.created_at || quote.data_criacao)}
              </TableCell>
              <TableCell className="font-medium text-sm">
                {formatCurrency(quote.valor_total)}
              </TableCell>
              <TableCell>
                <Badge variant={quote.status === 'aprovado' ? 'default' : 'secondary'}>
                  {quote.status === 'aprovado' ? 'Aprovado' : 'Aberto'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {quote.status === 'aberto' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectQuote(quote)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Analisar
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground mr-4">Finalizado</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
