import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { getAccessToken, getRefreshToken, isApiConfigured, onAuthStateChange } from '../services/apiClient'
import { getCurrentUser } from '../services/authService'

const demoUser = { id: 'demo-user', email: 'demo@uniform.test', user_metadata: { name: '김유니' } }
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
  const value = useMemo(() => ({ user, loading, demoMode: !isApiConfigured }), [user, loading])
  return createElement(AuthContext.Provider, { value }, children)
}
export function useAuth() { return useContext(AuthContext) }
