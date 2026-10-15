import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, CheckCircle2, Clock, Eye, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { fetchQuotes, Quote, rotuloStatus } from '@/lib/api-admin'
import { QuoteDetailsSheet } from './admin/QuoteDetailsSheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const formatDate = (date?: string) => {
  if (!date) return '—'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return date
  }
}

const somaValor = (lista: Quote[]) => lista.reduce((s, q) => s + (Number(q.valor_total) || 0), 0)

/**
 * Acompanhamento do representante: os orçamentos dos clientes que ele cadastrou, separados em
 * Em andamento (rascunho, aguardando aprovação) e Aprovados.
 */
export default function MyQuotesPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selecionado, setSelecionado] = useState<Quote | null>(null)

  const carregar = useCallback(() => {
    if (!user?.id) return
    setLoading(true)
    setError(false)
    fetchQuotes(user.id)
      .then(setQuotes)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  const aprovados = quotes.filter((q) => q.status === 'aprovado')
  const emAndamento = quotes.filter((q) => q.status !== 'aprovado')

  const lista = (itens: Quote[], vazio: string) =>
    itens.length === 0 ? (
      <div className="p-10 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
        {vazio}
      </div>
    ) : (
      <div className="space-y-3">
        {itens.map((q) => {
          const qtdPecas = q.items.reduce((s, i) => s + (Number(i.quantidade) || 0), 0)
          return (
            <Card
              key={q.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelecionado(q)}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{q.empresa}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {q.numero_orcamento || `#${q.id.split('-')[0]}`} · criado em{' '}
                    {formatDate(q.created_at)}
                    {q.data_aprovacao && <> · aprovado em {formatDate(q.data_aprovacao)}</>}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-sm text-muted-foreground">
                    {qtdPecas} {qtdPecas === 1 ? 'peça' : 'peças'}
                  </span>
                  <Badge variant={q.status === 'aprovado' ? 'default' : 'secondary'}>
                    {rotuloStatus(q.status)}
                  </Badge>
                  <span className="font-bold w-28 text-right">{formatCurrency(q.valor_total)}</span>
                  <Eye className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Orçamentos</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os orçamentos dos seus clientes: em andamento e aprovados.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Clock className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <div className="text-sm text-muted-foreground">Em andamento</div>
              <div className="text-2xl font-bold">{loading ? '—' : emAndamento.length}</div>
              <div className="text-sm text-muted-foreground">
                {loading ? '' : formatCurrency(somaValor(emAndamento))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
            <div>
              <div className="text-sm text-muted-foreground">Aprovados</div>
              <div className="text-2xl font-bold">{loading ? '—' : aprovados.length}</div>
              <div className="text-sm text-muted-foreground">
                {loading ? '' : formatCurrency(somaValor(aprovados))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="flex flex-col items-center p-10 bg-destructive/5 rounded-lg border border-destructive/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">Não foi possível carregar os orçamentos.</p>
          <Button variant="outline" onClick={carregar}>
            Tentar novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="andamento" className="w-full">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2 mb-4">
            <TabsTrigger value="andamento">Em andamento ({emAndamento.length})</TabsTrigger>
            <TabsTrigger value="aprovados">Aprovados ({aprovados.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="andamento">
            {lista(emAndamento, 'Nenhum orçamento em andamento.')}
          </TabsContent>
          <TabsContent value="aprovados">
            {lista(aprovados, 'Nenhum orçamento aprovado ainda.')}
          </TabsContent>
        </Tabs>
      )}

      <QuoteDetailsSheet quote={selecionado} onClose={() => setSelecionado(null)} />
    </div>
  )
}
