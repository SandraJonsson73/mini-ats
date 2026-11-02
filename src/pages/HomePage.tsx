import { useAuth } from '../auth/AuthContext'

export default function HomePage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-indigo-600">Mini-ATS</h1>
      <p className="mt-2">
        Inloggad som {profile?.email} ({profile?.role})
      </p>
      <button
        onClick={signOut}
        className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
      >
        Logga ut
      </button>
    </div>
  )
}
