import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { getAccessToken, getRefreshToken, isApiConfigured, onAuthStateChange } from '../services/apiClient'
import { getCurrentUser } from '../services/authService'

const demoUser = { id: 'demo-user', email: 'demo@uniform.test', user_metadata: { name: '김유니' } }
// 데모 모드(백엔드 미설정)에서는 관리자 콘솔도 둘러볼 수 있게 관리자로 둔다.
const demoProfile = { id: 'demo-user', email: 'demo@uniform.test', nickname: '김유니', role: 'ADMIN', status: 'active', restriction: null }
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
  const [user, setUser] = useState(isApiConfigured ? null : demoUser)
  const [loading, setLoading] = useState(isApiConfigured)
  useEffect(() => {
    if (!isApiConfigured) return undefined
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
    profile: isApiConfigured ? toProfile(user) : demoProfile,
    loading,
    demoMode: !isApiConfigured,
    refreshProfile: async () => { if (isApiConfigured && user) setUser(await getCurrentUser()) },
  }), [user, loading])
  return createElement(AuthContext.Provider, { value }, children)
}
export function useAuth() { return useContext(AuthContext) }
