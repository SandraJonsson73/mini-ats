import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useActiveOrg } from '../org/ActiveOrgContext'
import { ActiveOrgProvider } from '../org/ActiveOrgProvider'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
  }`

function Header() {
  const { profile, signOut } = useAuth()
  const { organizations, activeOrgId, setActiveOrgId } = useActiveOrg()
  const isAdmin = profile?.role === 'admin'

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
        <span className="mr-4 text-lg font-bold text-indigo-600">Mini-ATS</span>
        <NavLink to="/jobs" className={linkClass}>
          Jobb
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin/users" className={linkClass}>
            Användare
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-3">
          {isAdmin && (
            <select
              aria-label="Organisation"
              value={activeOrgId ?? ''}
              onChange={(e) => setActiveOrgId(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          <span className="text-sm text-slate-500">{profile?.email}</span>
          <button
            onClick={signOut}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
          >
            Logga ut
          </button>
        </div>
      </div>
    </header>
  )
}

export default function AppLayout() {
  return (
    <ActiveOrgProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl p-4">
          <Outlet />
        </main>
      </div>
    </ActiveOrgProvider>
  )
}
