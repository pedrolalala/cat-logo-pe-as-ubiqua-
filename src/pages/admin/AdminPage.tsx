import { useEffect, useState } from 'react'
import { checkAdminRole, fetchQuotes, approvePurchase, Quote } from '@/lib/api-admin'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldAlert, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuotesTable } from './QuotesTable'
import { QuoteDetailsSheet } from './QuoteDetailsSheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminImages } from './AdminImages'
import { AdminCatalog } from './AdminCatalog'
import { Package, Receipt, CopyPlus } from 'lucide-react'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [empresaFilter, setEmpresaFilter] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    checkAdminRole().then((isAdm) => {
      setIsAdmin(isAdm)
      if (isAdm) {
        loadQuotes()
      }
    })
  }, [])

  const loadQuotes = () => {
    setLoading(true)
    setError(false)
    fetchQuotes()
      .then(setQuotes)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const handleApprove = async () => {
    if (!selectedQuote) return
    setApproving(true)
    try {
      await approvePurchase(selectedQuote.id)
      toast.success('Compra aprovada com sucesso!')
      setSelectedQuote(null)
      loadQuotes()
    } catch {
      toast.error('Erro ao aprovar a compra. Tente novamente.')
    } finally {
      setApproving(false)
    }
  }

  if (isAdmin === null) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-center space-y-4 animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold tracking-tight">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão de administrador para acessar esta página.
        </p>
      </div>
    )
  }

  const filteredQuotes = quotes.filter((q) => {
    const matchStatus = statusFilter === 'todos' || q.status === statusFilter
    const nomeEmpresa = q.empresa || 'Empresa não informada'
    const matchEmpresa = nomeEmpresa.toLowerCase().includes(empresaFilter.toLowerCase())
    return matchStatus && matchEmpresa
  })

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Gerencie orçamentos e imagens do catálogo</p>
        </div>
      </div>

      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-3 mb-6">
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Imagens
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <CopyPlus className="w-4 h-4" />
            Agrupamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 bg-muted/20 p-4 rounded-lg border border-border/50 flex-1 w-full">
              <div className="w-full sm:max-w-xs">
                <Input
                  placeholder="Buscar por empresa..."
                  value={empresaFilter}
                  onChange={(e) => setEmpresaFilter(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadQuotes}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Atualizar
            </Button>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center p-12 bg-destructive/5 rounded-lg border border-destructive/20 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <div className="space-y-1">
                <h3 className="font-medium text-destructive">Falha ao carregar dados</h3>
                <p className="text-sm text-destructive/80">
                  Ocorreu um erro ao buscar os orçamentos.
                </p>
              </div>
              <Button
                onClick={loadQuotes}
                variant="outline"
                className="mt-4 border-destructive/30 hover:bg-destructive/10"
              >
                Tentar novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg border border-dashed text-center space-y-2">
              <p className="text-muted-foreground font-medium">Nenhum orçamento encontrado.</p>
              <p className="text-sm text-muted-foreground/70">
                Ajuste os filtros ou verifique novamente mais tarde.
              </p>
            </div>
          ) : (
            <QuotesTable quotes={filteredQuotes} onSelectQuote={setSelectedQuote} />
          )}
        </TabsContent>

        <TabsContent value="images">
          <AdminImages />
        </TabsContent>

        <TabsContent value="catalog">
          <AdminCatalog />
        </TabsContent>
      </Tabs>

      <QuoteDetailsSheet
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onApprove={handleApprove}
        isApproving={approving}
      />
    </div>
  )
}
