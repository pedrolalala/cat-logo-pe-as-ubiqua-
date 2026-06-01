import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowRight, Building2, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [nome, setNome] = useState(profile?.nome || user?.user_metadata?.nome || '')
  const [telefone, setTelefone] = useState(profile?.telefone || '')

  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome || !telefone) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomeEmpresa || !cnpj || !cidade || !estado) {
      toast.error('Preencha todos os dados da representação')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: empresa, error: empError } = await supabase
        .from('empresa_ubiqua' as any)
        .insert({
          nome_fantasia: nomeEmpresa,
          razao_social: razaoSocial || nomeEmpresa,
          cnpj,
          cidade,
          estado,
        })
        .select('id')
        .single()

      if (empError) throw empError

      const { error: userError } = await supabase.from('usuarios_ubiqua' as any).upsert({
        id: user!.id,
        nome,
        email: user!.email || '',
        telefone,
        empresa_id: empresa.id,
        onboarding_completado: true,
      })

      if (userError) throw userError

      await refreshProfile()
      toast.success('Perfil configurado com sucesso!')
      navigate('/')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao salvar informações')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-xl w-full shadow-lg border-muted">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-extrabold text-primary uppercase tracking-tighter">
            Primeiro Acesso
          </CardTitle>
          <CardDescription className="text-base">
            Configure seu perfil de representante e sua representação comercial para acessar o
            catálogo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form id="step1" onSubmit={handleNext} className="space-y-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <User className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Dados do Representante</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </form>
          ) : (
            <form id="step2" onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Building2 className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Dados da Representação</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Representação (Fantasia)</Label>
                  <Input
                    id="nomeEmpresa"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    placeholder="Ex: Representações Silva"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input
                    id="razaoSocial"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Razão Social LTDA"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    required
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Cidade"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      className="uppercase h-12"
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-6 border-t mt-4">
          {step === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="h-12 px-6"
            >
              Voltar
            </Button>
          )}

          {step === 1 ? (
            <Button type="submit" form="step1" className="gap-2 h-12 px-6">
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" form="step2" disabled={isSubmitting} className="gap-2 h-12 px-6">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Finalizar Cadastro
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
