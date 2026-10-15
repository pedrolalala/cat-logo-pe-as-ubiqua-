import { Quote } from '@/lib/api-admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

interface ResumoRepresentantesProps {
  quotes: Quote[]
  nomeRepresentante: (q: Quote) => string
  selecionado: string
  onSelecionar: (nome: string) => void
}

/** Acompanhamento por representante: quantidade e valor em andamento e aprovados. */
export function ResumoRepresentantes({
  quotes,
  nomeRepresentante,
  selecionado,
  onSelecionar,
}: ResumoRepresentantesProps) {
  const porRepresentante = new Map<
    string,
    { andamento: number; valorAndamento: number; aprovados: number; valorAprovados: number }
  >()
  quotes.forEach((q) => {
    const nome = nomeRepresentante(q)
    const linha = porRepresentante.get(nome) ?? {
      andamento: 0,
      valorAndamento: 0,
      aprovados: 0,
      valorAprovados: 0,
    }
    const valor = Number(q.valor_total) || 0
    if (q.status === 'aprovado') {
      linha.aprovados += 1
      linha.valorAprovados += valor
    } else {
      linha.andamento += 1
      linha.valorAndamento += valor
    }
    porRepresentante.set(nome, linha)
  })
  const linhas = Array.from(porRepresentante.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  if (linhas.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Acompanhamento por Representante</h3>
      <div className="border rounded-md bg-card overflow-x-auto shadow-sm">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>Representante</TableHead>
              <TableHead className="text-right">Em andamento</TableHead>
              <TableHead className="text-right">Valor em andamento</TableHead>
              <TableHead className="text-right">Aprovados</TableHead>
              <TableHead className="text-right">Valor aprovado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map(([nome, l]) => (
              <TableRow
                key={nome}
                className={cn(
                  'cursor-pointer hover:bg-muted/50',
                  selecionado === nome && 'bg-muted',
                )}
                onClick={() => onSelecionar(selecionado === nome ? 'todos' : nome)}
                title="Clique para filtrar a lista por este representante"
              >
                <TableCell className="font-medium">{nome}</TableCell>
                <TableCell className="text-right">{l.andamento}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(l.valorAndamento)}
                </TableCell>
                <TableCell className="text-right">{l.aprovados}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(l.valorAprovados)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
