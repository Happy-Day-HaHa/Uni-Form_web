import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../services/supabase'
import { getProfile } from '../services/userService'

const demoUser = { id: 'demo-user', email: 'demo@uniform.test', user_metadata: { name: '김유니' } }
const demoProfile = { id: 'demo-user', email: 'demo@uniform.test', nickname: '김유니', role: 'ADMIN', status: 'active', restriction: null }
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(isSupabaseConfigured ? null : demoUser)
  const [profile, setProfile] = useState(isSupabaseConfigured ? null : demoProfile)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  useEffect(() => {
    if (!supabase) return undefined
    const applySession = async (session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (!nextUser) { setProfile(null); setLoading(false); return }
      try { setProfile(await getProfile(nextUser.id)) } catch { setProfile(null) }
      finally { setLoading(false) }
    }
    supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { applySession(session) })
    return () => data.subscription.unsubscribe()
  }, [])
  const value = useMemo(() => ({ user, profile, loading, demoMode: !isSupabaseConfigured, refreshProfile: async () => { if (user) setProfile(await getProfile(user.id)) } }), [user, profile, loading])
  return createElement(AuthContext.Provider, { value }, children)
}
export function useAuth() { return useContext(AuthContext) }
