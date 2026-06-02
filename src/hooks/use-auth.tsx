import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const [ubiquaRes, usuariosRes] = await Promise.all([
      supabase
        .from('usuarios_ubiqua' as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('usuarios').select('*').eq('id', userId).maybeSingle(),
    ])
    setProfile({
      ...ubiquaRes.data,
      ...usuariosRes.data,
      role: usuariosRes.data?.role || ubiquaRes.data?.nivel_acesso,
      onboarding_completado:
        usuariosRes.data?.onboarding_completado || ubiquaRes.data?.onboarding_completado,
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        Promise.all([
          supabase
            .from('usuarios_ubiqua' as any)
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          supabase.from('usuarios').select('*').eq('id', session.user.id).maybeSingle(),
        ]).then(([ubiquaRes, usuariosRes]) => {
          setProfile({
            ...ubiquaRes.data,
            ...usuariosRes.data,
            role: usuariosRes.data?.role || ubiquaRes.data?.nivel_acesso,
            onboarding_completado:
              usuariosRes.data?.onboarding_completado || ubiquaRes.data?.onboarding_completado,
          })
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        Promise.all([
          supabase
            .from('usuarios_ubiqua' as any)
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          supabase.from('usuarios').select('*').eq('id', session.user.id).maybeSingle(),
        ]).then(([ubiquaRes, usuariosRes]) => {
          setProfile({
            ...ubiquaRes.data,
            ...usuariosRes.data,
            role: usuariosRes.data?.role || ubiquaRes.data?.nivel_acesso,
            onboarding_completado:
              usuariosRes.data?.onboarding_completado || ubiquaRes.data?.onboarding_completado,
          })
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, signUp, signIn, signOut, refreshProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}
