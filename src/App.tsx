import { Route, Routes } from 'react-router-dom'
import RequireAdmin from './auth/RequireAdmin'
import RequireAuth from './auth/RequireAuth'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/admin/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
