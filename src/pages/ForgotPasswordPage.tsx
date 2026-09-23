import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (error) {
        console.error('Error requesting password reset', error)
        toast.error('Não foi possível processar sua solicitação. Tente novamente.')
        setIsSubmitting(false)
        return
      }
    } catch (error) {
      console.error('Error requesting password reset', error)
      toast.error('Não foi possível processar sua solicitação. Tente novamente.')
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="max-w-md w-full p-8 bg-card border rounded-xl shadow-lg space-y-6">
        {submitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Verifique seu e-mail
            </h2>
            <p className="text-muted-foreground">
              Se esse e-mail existir na nossa base, você vai receber um link para redefinir a
              senha.
            </p>
            <Link
              to="/"
              className="inline-block text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Esqueci minha senha
              </h2>
              <p className="text-muted-foreground">
                Informe seu e-mail para receber um link de redefinição de senha.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-md" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Enviar link de redefinição
            </Button>
            <Link
              to="/"
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
