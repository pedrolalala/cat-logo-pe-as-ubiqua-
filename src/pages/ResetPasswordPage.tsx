import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const hasRecoveryHash = window.location.hash.includes('type=recovery')

      if (!session && !hasRecoveryHash) {
        toast.error('Link inválido ou expirado. Solicite uma nova redefinição de senha.')
        navigate('/esqueci-senha', { replace: true })
        return
      }

      setCheckingSession(false)
    }

    checkRecoverySession()
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error('Erro ao redefinir senha: ' + error.message)
        return
      }
      toast.success('Senha redefinida com sucesso! Faça login com a nova senha.')
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (error: any) {
      console.error('Error updating password', error)
      toast.error('Erro ao redefinir senha: ' + (error?.message || 'tente novamente.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full p-8 bg-card border rounded-xl shadow-lg space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Redefinir senha</h2>
          <p className="text-muted-foreground">Escolha uma nova senha para sua conta.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="h-12"
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 text-md" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Redefinir senha
        </Button>
      </form>
    </div>
  )
}
