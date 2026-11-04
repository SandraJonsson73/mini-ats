import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from './auth/RequireAdmin'
import RequireAuth from './auth/RequireAuth'
import AppLayout from './components/AppLayout'
import JobsPage from './pages/JobsPage'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/admin/UsersPage'
import BoardPage from './pages/BoardPage'
import AccountPage from './pages/AccountPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route element={<RequireAdmin />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
