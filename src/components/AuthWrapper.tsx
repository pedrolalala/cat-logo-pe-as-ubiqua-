import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
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

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <form
          onSubmit={handleLogin}
          className="max-w-md w-full p-8 bg-card border rounded-xl shadow-lg space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Acesso ao Catálogo
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para visualizar os produtos e orçamentos.
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
          </div>
          <Button type="submit" className="w-full h-12 text-md" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Entrar
          </Button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
