import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'customer'
  organization_id: string | null
}

export type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth måste användas inom AuthProvider')
  return ctx
}
