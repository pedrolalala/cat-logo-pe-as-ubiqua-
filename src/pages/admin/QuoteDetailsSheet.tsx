import { Quote } from '@/lib/api-admin'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, CheckCircle } from 'lucide-react'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Data indisponível'
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateString
  }
}

interface QuoteDetailsSheetProps {
  quote: Quote | null
  onClose: () => void
  onApprove: () => void
  isApproving: boolean
}

export function QuoteDetailsSheet({
  quote,
  onClose,
  onApprove,
  isApproving,
}: QuoteDetailsSheetProps) {
  if (!quote) return null

  return (
    <Sheet open={!!quote} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Analisar Orçamento</SheetTitle>
          <SheetDescription>
            Solicitado por{' '}
            <strong className="text-foreground">{quote.empresa || 'Não informada'}</strong> em{' '}
            {formatDate(quote.created_at || quote.data_criacao)}.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span>Itens do Pedido</span>
              <span>{formatCurrency(quote.valor_total)}</span>
            </h4>
            <div className="border rounded-md bg-muted/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.referencia}</div>
                        {item.descricao && (
                          <div className="text-xs text-muted-foreground">{item.descricao}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{item.quantidade}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(item.preco_unitario || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(
                          item.quantidade * (item.preco_unitario || 0) || item.subtotal || 0,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {quote.observacoes && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Observações do Cliente</h4>
              <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
                {quote.observacoes}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-8 flex-col sm:flex-row gap-3 sm:space-x-0">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={isApproving}
          >
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" onClick={onApprove} disabled={isApproving}>
            {isApproving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Aprovar Compra
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
