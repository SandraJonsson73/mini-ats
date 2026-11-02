import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) return <p className="p-8 text-slate-500">Laddar…</p>
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
