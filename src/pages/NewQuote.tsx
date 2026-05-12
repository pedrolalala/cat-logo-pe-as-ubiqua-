import { useCart } from '@/hooks/use-cart'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { saveQuoteToSupabase } from '@/lib/api'
import { toast } from 'sonner'
import { Trash2, ShoppingCart, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NewQuote() {
  const { items, clearCart, removeFromCart, updateQuantity } = useCart()
  const [observacoes, setObservacoes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const totalGeral = items.reduce((acc, item) => acc + item.valor_revenda * item.quantity, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(false)
    try {
      await saveQuoteToSupabase({
        items,
        observacoes,
        valor_total: totalGeral,
      })
      setIsSuccess(true)
      clearCart()
      toast.success('Orçamento salvo com sucesso!')
    } catch (e) {
      setSaveError(true)
      toast.error('Erro ao salvar o orçamento.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Orçamento Salvo!</h2>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          O seu orçamento foi registrado com sucesso e já está disponível no sistema.
        </p>
        <Button asChild size="lg">
          <Link to="/">Voltar ao Catálogo</Link>
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">Carrinho vazio</h2>
        <p className="text-muted-foreground max-w-md text-lg mb-8">
          Você ainda não adicionou nenhuma peça ao seu orçamento.
        </p>
        <Button asChild size="lg">
          <Link to="/">Explorar Catálogo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Novo Orçamento</h1>
          <p className="text-muted-foreground">
            Revise os itens e adicione observações ao orçamento.
          </p>
        </div>
        <Button variant="ghost" asChild className="self-start sm:self-auto">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuar Comprando
          </Link>
        </Button>
      </div>

      {saveError && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold">Erro ao salvar o orçamento</h3>
            <p className="text-sm mt-1 mb-3">
              Não foi possível conectar ao servidor para salvar o seu orçamento. Verifique sua
              conexão e tente novamente.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="bg-background hover:bg-background/90 text-destructive border-destructive/20"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Referência</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[120px] text-center">Quantidade</TableHead>
                <TableHead className="text-right w-[150px]">Preço Unitário</TableHead>
                <TableHead className="text-right w-[150px]">Subtotal</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-mono font-medium">{item.referencia}</TableCell>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-20 text-center h-9 font-medium"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(item.valor_revenda)}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap text-primary">
                    {formatCurrency(item.valor_revenda * item.quantity)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      onClick={() => removeFromCart(item.id)}
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4 flex flex-col h-full">
          <label htmlFor="observacoes" className="block text-sm font-medium">
            Observações
          </label>
          <Textarea
            id="observacoes"
            placeholder="Adicione observações ou instruções específicas para este orçamento..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="flex-1 min-h-[150px] resize-none focus-visible:ring-primary shadow-sm"
          />
        </div>

        <div className="bg-muted/30 rounded-xl p-6 flex flex-col justify-between border shadow-sm h-full">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-4">Resumo do Orçamento</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Subtotal dos itens ({items.length} {items.length === 1 ? 'item' : 'itens'})
              </span>
              <span className="font-medium">{formatCurrency(totalGeral)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-xl pt-4 border-t">
              <span>Valor Total Geral</span>
              <span className="text-primary">{formatCurrency(totalGeral)}</span>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 p-3.5 rounded-lg text-sm text-center font-medium border border-amber-500/20 shadow-sm">
              Atenção: Valores de ST (Substituição Tributária) a confirmar no faturamento
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-1/3 shadow-sm hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors"
                onClick={clearCart}
                disabled={isSaving}
              >
                Limpar Carrinho
              </Button>
              <Button
                className="w-full sm:w-2/3 shadow-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Orçamento'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
