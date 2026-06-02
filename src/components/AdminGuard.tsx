import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (profile?.role === 'admin' || profile?.nivel_acesso === 'admin') {
    return <>{children}</>
  }

  return <Navigate to="/perfil" replace />
}
