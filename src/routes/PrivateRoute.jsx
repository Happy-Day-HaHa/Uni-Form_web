import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingState from '../components/LoadingState'

export default function PrivateRoute() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState page>사용자 정보를 확인하고 있어요.</LoadingState>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile?.status === 'restricted' && location.pathname !== '/restricted') return <Navigate to="/restricted" replace />
  return <Outlet />
}
