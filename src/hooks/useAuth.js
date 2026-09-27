import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { getAccessToken, getRefreshToken, onAuthStateChange } from '../services/apiClient'
import { getCurrentUser } from '../services/authService'

const STATUS_FROM_API = { ACTIVE: 'active', PENDING_VERIFICATION: 'pending', RESTRICTED: 'restricted', WITHDRAWN: 'withdrawn' }

// GET /users/me → 관리자 라우트·이용 제한 화면이 쓰는 profile(role, status, restriction).
function toProfile(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.isAdmin ? 'ADMIN' : user.isStaff ? 'STAFF' : 'USER',
    status: STATUS_FROM_API[user.status] || 'active',
    restriction: user.restriction ? { category: user.restriction.reason, until: user.restriction.endsAt } : null,
  }
}

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChange((_event, nextUser) => { if (active) { setUser(nextUser ?? null); setLoading(false) } })
    // 저장된 토큰이 있으면 /users/me로 유효성을 확인한다. 만료됐으면 apiClient가 refresh를 시도하고, 실패하면 토큰을 지운다.
    if (!getAccessToken() && !getRefreshToken()) setLoading(false)
    else getCurrentUser()
      .then((me) => { if (active) setUser(me) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; unsubscribe() }
  }, [])
  const value = useMemo(() => ({
    user,
    profile: toProfile(user),
    loading,
    refreshProfile: async () => { if (user) setUser(await getCurrentUser()) },
  }), [user, loading])
  return createElement(AuthContext.Provider, { value }, children)
}
export function useAuth() { return useContext(AuthContext) }
