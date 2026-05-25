import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
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
import { saveQuoteToSupabase, sendQuoteEmail, QuoteData, saveClienteInfo } from '@/lib/api'
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

export default function NewQuote() {
  const { items, clearCart, removeFromCart, updateQuantity } = useCart()
  const { user, signUp } = useAuth()
  const [observacoes, setObservacoes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [savedQuote, setSavedQuote] = useState<QuoteData | null>(null)

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const [clienteInfo, setClienteInfo] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    data_nascimento: '',
  })
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const [signupPassword, setSignupPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)

  const isIdentValid =
    clienteInfo.nome.trim() !== '' &&
    clienteInfo.email.trim() !== '' &&
    clienteInfo.telefone.trim() !== '' &&
    clienteInfo.cpf_cnpj.trim() !== '' &&
    clienteInfo.data_nascimento.trim() !== ''

  const totalGeral = items.reduce((acc, item) => acc + item.valor_revenda * item.quantity, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleInitiateSave = () => {
    if (!user && !isIdentValid) {
      toast.error('Por favor, preencha todos os campos obrigatórios de identificação.')
      return
    }
    executeSaveQuote()
  }

  const executeSaveQuote = async () => {
    setIsSaving(true)
    setSaveError(false)

    let leadId: string | undefined = undefined

    if (user) {
      try {
        const { data: existing } = await supabase
          .from('informacoes_cliente_ubiqua')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()

        if (existing) {
          leadId = existing.id
        } else {
          const { data: inserted } = await supabase
            .from('informacoes_cliente_ubiqua')
            .insert({
              nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
              email: user.email,
            })
            .select('id')
            .single()
          if (inserted) leadId = inserted.id
        }
      } catch (e) {
        console.error('Failed to resolve user client info', e)
      }
    } else {
      try {
        const lead = await saveClienteInfo(clienteInfo)
        leadId = lead.id
      } catch (err) {
        setSaveError(true)
        toast.error('Não foi possível salvar seus dados de contato.')
        setIsSaving(false)
        return
      }
    }

    try {
      if (!leadId) throw new Error('Falha ao identificar o cliente.')

      const quoteData = {
        items,
        observacoes,
        valor_total: totalGeral,
        informacoes_cliente_id: leadId,
      }

      const saved = await saveQuoteToSupabase(quoteData)
      setSavedQuote(saved)
      clearCart()
      toast.success('Orçamento gerado com sucesso!')
    } catch (e) {
      console.error(e)
      setSaveError(true)
      toast.error('Erro ao processar o orçamento. Verifique os dados e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignup = async () => {
    if (!signupPassword) return
    setIsSigningUp(true)
    try {
      const { error } = await signUp(clienteInfo.email, signupPassword)
      if (error) throw error
      toast.success('Conta criada com sucesso!')
      setIsSignupModalOpen(false)
    } catch (e) {
      toast.error('Erro ao criar conta. Verifique suas informações e tente novamente.')
    } finally {
      setIsSigningUp(false)
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
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          O seu orçamento foi registrado com sucesso e já está disponível no sistema.
        </p>

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

        {!user && (
          <div className="mb-10 p-6 bg-muted/50 rounded-xl border max-w-md w-full animate-fade-in">
            <h3 className="font-semibold text-lg mb-2">Acompanhe seus pedidos</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Deseja criar uma senha para acompanhar seus pedidos?
            </p>
            <Button variant="outline" className="w-full" onClick={() => setIsSignupModalOpen(true)}>
              Criar uma conta
            </Button>
          </div>
        )}

        <Button variant="ghost" asChild size="lg" className="hover:text-orange-600">
          <Link to="/">Voltar ao Catálogo</Link>
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
                  className="w-full"
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar E-mail'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSignupModalOpen} onOpenChange={setIsSignupModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Conta</DialogTitle>
              <DialogDescription>
                Use seu e-mail para criar uma conta e acompanhar seus pedidos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={clienteInfo.email}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Crie uma senha segura"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSignupModalOpen(false)}
                disabled={isSigningUp}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSignup}
                disabled={!signupPassword || isSigningUp}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSigningUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Criar Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
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
              onClick={handleInitiateSave}
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
                  <TableCell className="font-medium">
                    {item.descricao}
                    {item.cor && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        Cor: {item.cor}
                      </span>
                    )}
                  </TableCell>
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
                  <TableCell className="text-right font-medium whitespace-nowrap text-orange-600">
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
            className="flex-1 min-h-[150px] resize-none focus-visible:ring-orange-500 shadow-sm"
          />
        </div>

        <div className="bg-muted/30 rounded-xl p-6 flex flex-col justify-between border shadow-sm h-full">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-4">Resumo do Orçamento</h3>

            {!user && (
              <div className="bg-card border rounded-lg p-4 mb-4 shadow-sm">
                <h4 className="font-medium text-sm mb-3">Seus Dados</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Nome Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={clienteInfo.nome}
                      onChange={(e) =>
                        setClienteInfo((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      placeholder="Ex: João da Silva"
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      CPF / CNPJ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={clienteInfo.cpf_cnpj}
                      onChange={(e) =>
                        setClienteInfo((prev) => ({ ...prev, cpf_cnpj: e.target.value }))
                      }
                      placeholder="Ex: 000.000.000-00"
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={clienteInfo.email}
                      onChange={(e) =>
                        setClienteInfo((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Ex: joao@email.com"
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Telefone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="tel"
                      value={clienteInfo.telefone}
                      onChange={(e) =>
                        setClienteInfo((prev) => ({ ...prev, telefone: e.target.value }))
                      }
                      placeholder="Ex: (11) 99999-9999"
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Data de Nascimento <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={clienteInfo.data_nascimento}
                      onChange={(e) =>
                        setClienteInfo((prev) => ({ ...prev, data_nascimento: e.target.value }))
                      }
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Subtotal dos itens ({items.length} {items.length === 1 ? 'item' : 'itens'})
              </span>
              <span className="font-medium">{formatCurrency(totalGeral)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-xl pt-4 border-t">
              <span>Valor Total Geral</span>
              <span className="text-orange-600">{formatCurrency(totalGeral)}</span>
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
                className="w-full sm:w-2/3 shadow-sm bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleInitiateSave}
                disabled={isSaving || (!user && !isIdentValid)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Orçamento'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
