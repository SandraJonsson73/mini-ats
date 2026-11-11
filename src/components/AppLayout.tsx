import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useActiveOrg } from '../org/ActiveOrgContext'
import { ActiveOrgProvider } from '../org/ActiveOrgProvider'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

function Header() {
  const { profile, signOut } = useAuth()
  const { organizations, activeOrgId, setActiveOrgId } = useActiveOrg()
  const isAdmin = profile?.role === 'admin'

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
        <span className="mr-4 whitespace-nowrap text-lg font-bold tracking-tight text-indigo-600 sm:mr-6">Mini-ATS</span>
        <NavLink to="/board" className={linkClass}>
          Kandidater
        </NavLink>
        <NavLink to="/jobs" className={linkClass}>
          Jobb
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin/users" className={linkClass}>
            Användare
          </NavLink>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          {isAdmin && (
            <select
              aria-label="Organisation"
              value={activeOrgId ?? ''}
              onChange={(e) => setActiveOrgId(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          <NavLink to="/account" className={(s) => `${linkClass(s)} max-w-40 truncate`}>
            {profile?.email}
          </NavLink>
          <button
            onClick={signOut}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
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
        <main className="mx-auto max-w-7xl px-6 py-6">
          <Outlet />
        </main>
      </div>
    </ActiveOrgProvider>
  )
}
