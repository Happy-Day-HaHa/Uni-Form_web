import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminRoute() {
  const { user, profile, loading, demoMode } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-state">관리자 권한을 확인하고 있어요.</div>
  if (!user && !demoMode) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile?.status === 'restricted') return <Navigate to="/restricted" replace />
  if (profile?.role !== 'ADMIN') return <Navigate to="/admin/forbidden" replace />
  return <Outlet />
}
