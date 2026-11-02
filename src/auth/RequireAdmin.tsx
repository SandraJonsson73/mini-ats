import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAdmin() {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
