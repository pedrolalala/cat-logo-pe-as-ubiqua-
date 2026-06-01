import { Quote } from '@/lib/api-admin'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [faturamentoFilter, setFaturamentoFilter] = useState<string>('all')

  const filteredQuotes = quotes.filter((q) => {
    if (faturamentoFilter === 'all') return true
    if (faturamentoFilter === 'islight') return q.faturamento?.toLowerCase().includes('islight')
    if (faturamentoFilter === 'manoella')
      return (
        q.faturamento?.toLowerCase().includes('manoella') ||
        q.faturamento?.toLowerCase().includes('lucenera')
      )
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Lista de Orçamentos</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={faturamentoFilter} onValueChange={setFaturamentoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Faturamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Faturamentos</SelectItem>
              <SelectItem value="islight">Islight</SelectItem>
              <SelectItem value="manoella">Manoella</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card border border-dashed rounded-md">
          Nenhum orçamento encontrado com este filtro.
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filteredQuotes.map((quote) => (
              <Card
                key={quote.id}
                className={cn(
                  'overflow-hidden',
                  quote.status === 'rascunho' &&
                    'cursor-pointer hover:border-primary/50 transition-colors',
                )}
                onClick={() => quote.status === 'rascunho' && onSelectQuote(quote)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold">{quote.empresa || 'Cliente não informado'}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {quote.numero_orcamento || `#${quote.id.split('-')[0]}`}
                      </div>
                    </div>
                    <Badge
                      variant={quote.status === 'aprovado' ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {quote.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">
                      {formatDate(quote.created_at || quote.data_criacao)}
                    </span>
                    <span className="font-bold">{formatCurrency(quote.valor_total)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {quote.faturamento}
                    </Badge>
                    {quote.status === 'rascunho' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectQuote(quote)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Analisar
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Finalizado</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block border rounded-md bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número / Cliente</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className={cn(
                      'transition-colors',
                      quote.status === 'rascunho' && 'cursor-pointer hover:bg-muted/50',
                    )}
                    onClick={() => quote.status === 'rascunho' && onSelectQuote(quote)}
                  >
                    <TableCell>
                      <div className="font-medium">{quote.empresa || 'Cliente não informado'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {quote.numero_orcamento || `#${quote.id.split('-')[0]}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {quote.faturamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(quote.created_at || quote.data_criacao)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatCurrency(quote.valor_total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quote.status === 'aprovado' ? 'default' : 'secondary'}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {quote.status === 'rascunho' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9"
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
        </>
      )}
    </div>
  )
}
