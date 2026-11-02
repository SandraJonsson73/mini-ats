import { createContext, useContext } from 'react'
import type { Organization } from '../lib/users'

export type ActiveOrgState = {
  organizations: Organization[]
  activeOrgId: string | null
  setActiveOrgId: (id: string) => void
}

export const ActiveOrgContext = createContext<ActiveOrgState | null>(null)

export function useActiveOrg() {
  const ctx = useContext(ActiveOrgContext)
  if (!ctx) throw new Error('useActiveOrg måste användas inom ActiveOrgProvider')
  return ctx
}
