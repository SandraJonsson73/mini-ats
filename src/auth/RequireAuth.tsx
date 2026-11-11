import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="animate-pulse text-2xl font-bold tracking-tight text-indigo-600">Mini-ATS</span>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="p-8">
        <p className="text-red-600">Kontot saknar profil. Kontakta administratören.</p>
        <button onClick={signOut} className="mt-4 underline">
          Logga ut
        </button>
      </div>
    )
  }

  return <Outlet />
}
