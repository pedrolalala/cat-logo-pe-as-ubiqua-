import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { sendQuoteEmail, QuoteData } from '@/lib/api'
import { toast } from 'sonner'
import {
  Trash2,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Mail,
  CheckCircle,
  Search,
  Plus,
  Minus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { generateQuotePDFBase64, downloadMockPDF } from '@/lib/pdf'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

export default function NewQuote() {
  const {
    items,
    clearCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    activeQuoteId,
    setActiveQuoteId,
    selectedCustomerId,
    setSelectedCustomerId,
    addToCart,
  } = useCart()

  const { user } = useAuth()
  const [observacoes, setObservacoes] = useState('')
  const [descontoGlobal, setDescontoGlobal] = useState<number>(0)

  const [isSaving, setIsSaving] = useState(false)
  const [savingStatus, setSavingStatus] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [savedQuote, setSavedQuote] = useState<QuoteData | null>(null)

  const [customers, setCustomers] = useState<any[]>([])
  const [openClientPopover, setOpenClientPopover] = useState(false)

  const [openProductPopover, setOpenProductPopover] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<any[]>([])
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const colorMap: Record<string, string> = {
    'UV BRONZE': '#A87932',
    'UV CHROME': '#D1D1D1',
    'UV DOURADA': '#D4AF37',
    'MÁRMORE VERDE': '#2E473B',
    'MÁRMORE PRETO': '#1A1A1A',
    'MÁRMORE BRANCO': '#F2F2F2',
    CIMENTO: '#8E9089',
    'VERMELHO CHAMA': '#CF352E',
  }

  useEffect(() => {
    supabase
      .from('informacoes_cliente_ubiqua')
      .select('*')
      .order('nome')
      .then(({ data }) => {
        if (data) setCustomers(data)
      })
  }, [])

  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length < 3) {
        setProductResults([])
        return
      }
      setIsSearchingProducts(true)
      const { data } = await supabase
        .from('revenda_ubiqua')
        .select('*')
        .or(`descricao.ilike.%${productSearch}%,referencia.ilike.%${productSearch}%`)
        .limit(20)
      setProductResults(data || [])
      setIsSearchingProducts(false)
    }
    const delayDebounceFn = setTimeout(() => {
      searchProducts()
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [productSearch])

  const subtotalItems = items.reduce((acc, item) => acc + item.valor_revenda * item.quantity, 0)
  const totalGeral = Math.max(0, subtotalItems - descontoGlobal)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const selectedClient = customers.find((c) => c.id === selectedCustomerId)

  const handleStartQuote = async () => {
    if (!selectedCustomerId) {
      toast.error('Selecione um cliente para iniciar o orçamento.')
      return
    }

    setIsSaving(true)
    try {
      const { data: quote, error } = await supabase
        .from('orcamentos_revenda_ubiqua')
        .insert({
          cliente_id: selectedCustomerId,
          status: 'rascunho',
          numero_orcamento: '',
          valor_subtotal: 0,
          valor_total: 0,
          valor_desconto: 0,
        })
        .select()
        .single()

      if (error) throw error
      setActiveQuoteId(quote.id)
      toast.success('Sessão de orçamento iniciada.')
    } catch (error: any) {
      toast.error('Erro ao iniciar orçamento: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInitiateSave = () => {
    if (!selectedCustomerId || !activeQuoteId) {
      toast.error('O orçamento precisa de um cliente vinculado.')
      return
    }
    if (items.some((item) => item.quantity <= 0)) {
      toast.error('A quantidade de todos os itens deve ser maior que zero.')
      return
    }
    executeSaveQuote()
  }

  const executeSaveQuote = async () => {
    setIsSaving(true)
    setSavingStatus('Salvando orçamento...')
    setSaveError(false)

    try {
      if (!selectedCustomerId || !activeQuoteId) throw new Error('Dados do orçamento ausentes.')

      const hasBackorderItem = items.some((item) => (Number(item.disponivel) || 0) <= 0)

      const { error: quoteError } = await supabase
        .from('orcamentos_revenda_ubiqua')
        .update({
          observacoes: observacoes,
          valor_subtotal: subtotalItems,
          valor_desconto: descontoGlobal,
          valor_total: totalGeral,
          status: 'rascunho',
          ...(hasBackorderItem
            ? { prazo_entrega: 'Contém item(ns) sem estoque — prazo estimado de até 90 dias para importação' }
            : {}),
        })
        .eq('id', activeQuoteId)

      if (quoteError) throw quoteError

      await supabase.from('itens_orcamento_ubiqua').delete().eq('orcamento_id', activeQuoteId)

      const itemsToInsert = items.map((item, idx) => ({
        orcamento_id: activeQuoteId,
        produto_id: Number(item.id),
        quantidade: item.quantity,
        valor_unitario: item.valor_revenda,
        desconto_item: 0,
        ordem: idx,
        referencia_snapshot: item.referencia,
        descricao_snapshot: item.descricao,
        marca_snapshot: item.desc_marca || null,
        sem_estoque_no_pedido: (Number(item.disponivel) || 0) <= 0,
      }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('itens_orcamento_ubiqua')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      setSavingStatus('Processando e enviando PDF...')
      const { error: fnError } = await supabase.functions.invoke('process-budget-pdf', {
        body: { quote_id: activeQuoteId },
      })

      if (fnError) {
        console.error('Error generating PDF:', fnError)
        toast.error('Orçamento salvo, mas houve uma falha ao gerar o PDF.')
      } else {
        toast.success('Orçamento gerado e PDF enviado com sucesso!')
      }

      const { data: savedData } = await supabase
        .from('orcamentos_revenda_ubiqua')
        .select('*')
        .eq('id', activeQuoteId)
        .single()

      setSavedQuote(savedData as QuoteData)
      clearCart()
    } catch (e: any) {
      console.error(e)
      setSaveError(true)
      let msg = e.message || 'Erro ao processar o orçamento. Verifique os dados e tente novamente.'
      setErrorMessage(msg)
      toast.error(`Falha na solicitação: ${msg}`)
    } finally {
      setIsSaving(false)
      setSavingStatus('')
    }
  }

  const handleDownloadPDF = async () => {
    if (!savedQuote) return
    setIsGeneratingPDF(true)
    try {
      await downloadMockPDF(savedQuote)
      toast.success('Documento gerado com sucesso.')
    } catch (error) {
      toast.error('Erro ao gerar o documento.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleSendEmail = async () => {
    if (!savedQuote || !emailRecipient) return
    setIsSendingEmail(true)
    try {
      const pdfBase64 = await generateQuotePDFBase64(savedQuote)
      await sendQuoteEmail(emailRecipient, pdfBase64, savedQuote)
      toast.success('PDF enviado com sucesso')
      setIsEmailModalOpen(false)
      setEmailRecipient('')
    } catch (error) {
      toast.error('Falha ao enviar o e-mail. Tente novamente.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (savedQuote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
        <div className="h-20 w-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Orçamento Salvo!</h2>
        <p className="text-muted-foreground mb-4 max-w-md text-lg">
          O seu orçamento foi registrado com sucesso e já está disponível no sistema.
        </p>

        {savedQuote?.numero_orcamento && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg font-mono text-lg font-semibold mb-8">
            Nº {savedQuote.numero_orcamento}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full max-w-md justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:w-auto border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Baixar PDF
          </Button>
          <Button
            size="lg"
            onClick={() => setIsEmailModalOpen(true)}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar por E-mail
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => setSavedQuote(null)}
          size="lg"
          className="hover:text-orange-600"
        >
          Novo Orçamento
        </Button>

        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enviar por E-mail</DialogTitle>
              <DialogDescription>
                Insira o endereço de e-mail do destinatário para enviar este orçamento com o PDF em
                anexo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail do destinatário</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  disabled={isSendingEmail}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEmailModalOpen(false)}
                disabled={isSendingEmail}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailRecipient}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                  </>
                ) : (
                  'Enviar E-mail'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (!activeQuoteId) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-card rounded-xl border shadow-sm p-8 text-center animate-fade-in-up">
          <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Novo Orçamento</h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            O fluxo de vendas requer a seleção de um cliente válido para acessar o catálogo de
            produtos e criar cotações.
          </p>

          <div className="text-left space-y-5 max-w-md mx-auto bg-muted/30 p-6 rounded-lg border">
            <div className="space-y-2">
              <Label className="font-semibold">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Popover open={openClientPopover} onOpenChange={setOpenClientPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClientPopover}
                    className="w-full justify-between font-normal bg-background"
                  >
                    {selectedClient
                      ? `${selectedClient.nome} ${selectedClient.cpf_cnpj ? `(${selectedClient.cpf_cnpj})` : ''}`
                      : 'Selecione um cliente...'}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] sm:w-[var(--radix-popover-trigger-width)] p-0"
                  align="center"
                  sideOffset={8}
                >
                  <Command>
                    <CommandInput placeholder="Buscar por nome ou CNPJ..." />
                    <CommandList>
                      <CommandEmpty>
                        Nenhum cliente encontrado.
                        <div className="mt-4 pb-2 px-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full text-orange-600 border-orange-200"
                          >
                            <Link to="/clientes">Cadastrar Novo Cliente</Link>
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.nome} ${c.cpf_cnpj || ''}`}
                            onSelect={() => {
                              setSelectedCustomerId(c.id)
                              setOpenClientPopover(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{c.nome}</span>
                              {c.cpf_cnpj && (
                                <span className="text-xs text-muted-foreground">{c.cpf_cnpj}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
              disabled={!selectedCustomerId || isSaving}
              onClick={handleStartQuote}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Iniciar Orçamento
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Orçamento em Andamento</h1>
          <p className="text-muted-foreground text-sm">
            Adicione produtos do catálogo e ajuste os valores.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={clearCart}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto"
        >
          Cancelar Orçamento
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-5 border-b">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Cliente Vinculado
            </h3>
            <p className="font-medium text-lg">{selectedClient?.nome}</p>
            {selectedClient?.cpf_cnpj && (
              <p className="text-sm text-muted-foreground">{selectedClient.cpf_cnpj}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Catálogo: Adicionar Produtos</Label>
          <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full sm:w-[400px] justify-between font-normal text-muted-foreground bg-muted/30"
              >
                Buscar por Referência ou Descrição...
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-[600px] p-0"
              align="center"
              sideOffset={8}
            >
              <Command>
                <CommandInput
                  placeholder="Digite pelo menos 3 caracteres..."
                  value={productSearch}
                  onValueChange={setProductSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearchingProducts
                      ? 'Buscando...'
                      : 'Nenhum produto encontrado. Refine a busca.'}
                  </CommandEmpty>
                  <CommandGroup>
                    {productResults.map((p) => {
                      const isOutOfStock = (Number(p.disponivel) || 0) <= 0
                      return (
                        <CommandItem
                          key={p.id}
                          value={`${p.referencia} ${p.descricao}`}
                          onSelect={() => {
                            addToCart(p, 1)
                            setOpenProductPopover(false)
                            setProductSearch('')
                            setProductResults([])
                            toast.success('Produto adicionado ao orçamento!')
                          }}
                          className="flex items-center justify-between py-2 cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{p.referencia}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-[400px]">
                              {p.descricao}
                            </span>
                            {isOutOfStock && (
                              <span className="text-xs font-semibold text-orange-600 mt-1">
                                Sem estoque
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(p.valor_revenda || 0)}
                          </span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed shadow-sm p-10 text-center text-muted-foreground">
          Nenhum produto adicionado. Use a busca acima para incluir itens.
        </div>
      ) : (
        <>
          {/* Mobile Cart Items (Cards) */}
          <div className="md:hidden space-y-4">
            {items.map((item) => {
              const itemDisponivel = Number(item.disponivel) || 0
              const itemMaxQty = itemDisponivel > 0 ? itemDisponivel : 999
              return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-sm text-primary">
                        {item.referencia}
                      </div>
                      <div className="font-medium text-sm leading-tight">{item.descricao}</div>
                      {item.cor && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <span
                            className="w-3 h-3 rounded-full inline-block border border-black/10 shadow-sm"
                            style={{ backgroundColor: colorMap[item.cor.toUpperCase()] || '#ccc' }}
                          />
                          {item.cor}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Preço Unit.</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={item.valor_revenda}
                        onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                        className="h-11 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Subtotal</Label>
                      <div className="flex items-center h-11 font-bold text-orange-600">
                        {formatCurrency(item.valor_revenda * item.quantity)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                    <span className="text-sm font-semibold pl-2">Quantidade</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={itemMaxQty}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.id,
                            Math.min(itemMaxQty, Math.max(1, parseInt(e.target.value) || 1)),
                          )
                        }
                        className="w-16 text-center h-10 font-bold"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= itemMaxQty}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>

          {/* Desktop Cart Items (Table) */}
          <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[750px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[120px]">Referência</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[140px] text-center">Quantidade</TableHead>
                    <TableHead className="text-right w-[140px]">Preço Unit.</TableHead>
                    <TableHead className="text-right w-[140px]">Subtotal</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const itemDisponivel = Number(item.disponivel) || 0
                    const itemMaxQty = itemDisponivel > 0 ? itemDisponivel : 999
                    return (
                    <TableRow key={item.id} className="group">
                      <TableCell className="font-mono font-medium text-xs">
                        {item.referencia}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {item.descricao}
                        {item.cor && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <span
                              className="w-3 h-3 rounded-full inline-block border border-black/10"
                              style={{
                                backgroundColor: colorMap[item.cor.toUpperCase()] || '#ccc',
                              }}
                            />
                            {item.cor}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={itemMaxQty}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                Math.min(itemMaxQty, Math.max(1, parseInt(e.target.value) || 1)),
                              )
                            }
                            className="w-14 text-center h-8 font-medium px-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= itemMaxQty}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.valor_revenda}
                          onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                          className="w-full text-right h-8 font-medium"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatCurrency(item.valor_revenda * item.quantity)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 flex flex-col h-full">
          <Label htmlFor="observacoes" className="text-sm font-semibold">
            Observações Comerciais
          </Label>
          <Textarea
            id="observacoes"
            placeholder="Instruções específicas para o documento..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="flex-1 min-h-[150px] resize-none focus-visible:ring-orange-500 shadow-sm bg-card"
          />
        </div>

        <div className="bg-card rounded-xl p-5 border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-3 mb-2">Resumo Financeiro</h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
              <span className="font-medium">{formatCurrency(subtotalItems)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Desconto Global (R$)</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={descontoGlobal || ''}
                onChange={(e) => setDescontoGlobal(parseFloat(e.target.value) || 0)}
                className="w-28 text-right h-8"
              />
            </div>

            <div className="flex justify-between items-center font-bold text-xl pt-4 border-t mt-4">
              <span>Valor Total</span>
              <span className="text-orange-600">{formatCurrency(totalGeral)}</span>
            </div>
          </div>

          <div className="mt-8">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
              onClick={handleInitiateSave}
              disabled={isSaving || items.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {savingStatus}
                </>
              ) : (
                'Finalizar e Gerar PDF'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
