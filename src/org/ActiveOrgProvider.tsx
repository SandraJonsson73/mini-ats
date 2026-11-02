import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { fetchOrganizations } from '../lib/users'
import { ActiveOrgContext } from './ActiveOrgContext'

const STORAGE_KEY = 'activeOrgId'

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()

  // RLS gör att admin får alla organisationer och kunden bara sin egen
  const orgs = useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations })
  const organizations = orgs.data ?? []

  const [chosen, setChosen] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })

  const activeOrgId =
    profile?.role === 'admin'
      ? (organizations.find((o) => o.id === chosen)?.id ?? organizations[0]?.id ?? null)
      : (profile?.organization_id ?? null)

  const setActiveOrgId = (id: string) => {
    setChosen(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // localStorage kan vara blockerat, valet gäller då bara tills sidan laddas om
    }
  }

  return (
    <ActiveOrgContext.Provider value={{ organizations, activeOrgId, setActiveOrgId }}>
      {children}
    </ActiveOrgContext.Provider>
  )
}
