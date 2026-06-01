import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { formatCNPJ, isValidCNPJ } from '@/lib/utils'

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    nome: '',
    email: '',
    telefone: '',
  })

  const [company, setCompany] = useState({
    id: '',
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    cidade: '',
    estado: '',
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios_ubiqua')
        .select('*, empresa:empresa_ubiqua(*)')
        .eq('id', user!.id)
        .single()

      if (userError) throw userError

      if (userData) {
        setProfile({
          nome: userData.nome || '',
          email: userData.email || '',
          telefone: userData.telefone || '',
        })

        const emp = userData.empresa
        if (emp && !Array.isArray(emp)) {
          setCompany({
            id: emp.id,
            nome_fantasia: emp.nome_fantasia || '',
            razao_social: emp.razao_social || '',
            cnpj: emp.cnpj || '',
            cidade: emp.cidade || '',
            estado: emp.estado || '',
          })
        }
      }
    } catch (error: any) {
      console.error('Error loading profile', error)
      toast.error('Erro ao carregar perfil: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile.nome) {
      toast.error('O nome do representante é obrigatório.')
      return
    }
    if (!company.nome_fantasia || !company.cidade || !company.estado || !company.cnpj) {
      toast.error('Nome Fantasia, CNPJ, Cidade e Estado da empresa são obrigatórios.')
      return
    }

    if (!isValidCNPJ(company.cnpj)) {
      toast.error('CNPJ inválido. Verifique o formato.')
      return
    }

    setSaving(true)
    try {
      let empresaId = company.id

      if (!empresaId) {
        // Create company
        const { data: newCompany, error: compError } = await supabase
          .from('empresa_ubiqua')
          .insert({
            nome_fantasia: company.nome_fantasia,
            razao_social: company.razao_social,
            cnpj: company.cnpj,
            cidade: company.cidade,
            estado: company.estado,
          })
          .select()
          .single()

        if (compError) throw compError
        empresaId = newCompany.id
        setCompany({ ...company, id: empresaId })
      } else {
        // Update company
        const { error: compError } = await supabase
          .from('empresa_ubiqua')
          .update({
            nome_fantasia: company.nome_fantasia,
            razao_social: company.razao_social,
            cnpj: company.cnpj,
            cidade: company.cidade,
            estado: company.estado,
          })
          .eq('id', empresaId)
        if (compError) throw compError
      }

      // Update profile
      const { error: profError } = await supabase
        .from('usuarios_ubiqua')
        .update({
          nome: profile.nome,
          telefone: profile.telefone,
          empresa_id: empresaId,
        })
        .eq('id', user!.id)

      if (profError) throw profError

      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error(error)
      toast.error('Erro ao salvar perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Módulo de Representante</h1>
          <p className="text-muted-foreground">Gerencie seus dados pessoais e da sua empresa.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8 bg-card border rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dados Pessoais</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                required
                value={profile.nome}
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                disabled
                value={profile.email}
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={profile.telefone}
                onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dados da Empresa</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">
                Nome Fantasia <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome_fantasia"
                required
                value={company.nome_fantasia}
                onChange={(e) => setCompany({ ...company, nome_fantasia: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input
                id="razao_social"
                value={company.razao_social}
                onChange={(e) => setCompany({ ...company, razao_social: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cnpj">
                CNPJ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cnpj"
                required
                maxLength={18}
                value={company.cnpj}
                onChange={(e) => setCompany({ ...company, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">
                Cidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cidade"
                required
                value={company.cidade}
                onChange={(e) => setCompany({ ...company, cidade: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">
                Estado (UF) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="estado"
                required
                maxLength={2}
                placeholder="SP"
                value={company.estado}
                onChange={(e) => setCompany({ ...company, estado: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} size="lg">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
