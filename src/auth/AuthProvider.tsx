import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type Profile } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase meddelar direkt vid start och vid varje in-/utloggning
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setSessionReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  // Hämta den inloggades profil (roll + organisation). RLS tillåter bara den egna raden.
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()
      if (error) throw error
      return data as Profile
    },
  })

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile: profileQuery.data ?? null,
        loading: !sessionReady || (!!userId && profileQuery.isPending),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}