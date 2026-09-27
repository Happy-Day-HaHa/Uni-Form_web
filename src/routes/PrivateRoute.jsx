import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PrivateRoute() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-state">사용자 정보를 확인하고 있어요.</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile?.status === 'restricted' && location.pathname !== '/restricted') return <Navigate to="/restricted" replace />
  return <Outlet />
}
