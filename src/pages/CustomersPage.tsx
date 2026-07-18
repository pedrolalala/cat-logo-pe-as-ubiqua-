import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowLeft,
  MoreVertical,
  Phone,
  Mail,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Link } from 'react-router-dom'

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredCustomers(customers)
    } else {
      const lowerSearch = search.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.nome?.toLowerCase().includes(lowerSearch) ||
            c.email?.toLowerCase().includes(lowerSearch) ||
            c.cpf_cnpj?.includes(lowerSearch),
        ),
      )
    }
  }, [search, customers])

  async function loadCustomers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('informacoes_cliente_ubiqua')
        .select('*')
        .order('nome')
      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setFormData({ nome: '', email: '', telefone: '', cpf_cnpj: '' })
    setEditingId(null)
    setIsModalOpen(true)
  }

  function openEdit(customer: any) {
    setFormData({
      nome: customer.nome || '',
      email: customer.email || '',
      telefone: customer.telefone || '',
      cpf_cnpj: customer.cpf_cnpj || '',
    })
    setEditingId(customer.id)
    setIsModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nome || !formData.email || !formData.telefone || !formData.cpf_cnpj) {
      toast.error('Nome, Email, Telefone e CNPJ são obrigatórios.')
      return
    }

    if (!isValidCNPJ(formData.cpf_cnpj)) {
      toast.error('CNPJ inválido. Verifique o formato.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cpf_cnpj: formData.cpf_cnpj,
      }

      if (editingId) {
        const { error } = await supabase
          .from('informacoes_cliente_ubiqua')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        toast.success('Cliente atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('informacoes_cliente_ubiqua')
          .insert([{ ...payload, cadastrado_por_usuario_id: user?.id }])
        if (error) throw error
        toast.success('Cliente criado com sucesso!')
      }

      setIsModalOpen(false)
      loadCustomers()
    } catch (error: any) {
      toast.error('Erro ao salvar cliente: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este cliente?')) return

    setDeletingId(id)
    try {
      const { error } = await supabase.from('informacoes_cliente_ubiqua').delete().eq('id', id)
      if (error) throw error
      toast.success('Cliente excluído com sucesso!')
      loadCustomers()
    } catch (error: any) {
      toast.error('Não é possível excluir o cliente. Ele pode estar vinculado a um orçamento.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Módulo de Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua carteira de clientes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <Button onClick={openNew} className="bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-dashed">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg leading-tight">{c.nome}</h3>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{c.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>{c.cpf_cnpj || 'Não informado'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-2 flex justify-end gap-2 border-t">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => openEdit(c)}
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.telefone}</TableCell>
                    <TableCell>{c.cpf_cnpj || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          title="Excluir"
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  inputMode="numeric"
                  className="h-12"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf_cnpj"
                  type="tel"
                  inputMode="numeric"
                  className="h-12"
                  required
                  maxLength={18}
                  placeholder="00.000.000/0000-00"
                  value={formData.cpf_cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf_cnpj: formatCNPJ(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
