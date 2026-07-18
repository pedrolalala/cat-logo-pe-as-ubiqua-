import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type AuthMode = 'login' | 'signup'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    const resetPasswordFields = () => {
      setPassword('')
      setConfirmPassword('')
    }

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      const { error } = await signIn(email, password)
      setIsSubmitting(false)
      if (error) {
        toast.error('Falha no login. Verifique suas credenciais.')
      } else {
        toast.success('Login realizado com sucesso!')
      }
    }

    const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault()
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem.')
        return
      }
      setIsSubmitting(true)
      const { error, hasSession } = await signUp(email, password)
      setIsSubmitting(false)
      if (error) {
        toast.error('Falha ao criar conta. Verifique os dados e tente novamente.')
      } else if (hasSession) {
        toast.success('Conta criada! Você já está conectado.')
      } else {
        toast.success('Conta criada! Verifique sua caixa de entrada para confirmar o e-mail antes de entrar.')
        resetPasswordFields()
        setMode('login')
      }
    }

    const toggleMode = () => {
      setMode((current) => (current === 'login' ? 'signup' : 'login'))
      resetPasswordFields()
    }

    const isSignUp = mode === 'signup'

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <form
          onSubmit={isSignUp ? handleSignUp : handleLogin}
          className="max-w-md w-full p-8 bg-card border rounded-xl shadow-lg space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Criar Conta de Representante' : 'Acesso ao Catálogo'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp
                ? 'Crie sua conta para começar seu cadastro como representante.'
                : 'Entre com suas credenciais para visualizar os produtos e orçamentos.'}
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            {isSignUp ? (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            ) : null}
          </div>
          <Button type="submit" className="w-full h-12 text-md" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>
          <button
            type="button"
            onClick={toggleMode}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Criar conta'}
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
