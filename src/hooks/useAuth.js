import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../services/supabase'

const demoUser = { id: 'demo-user', email: 'demo@uniform.test', user_metadata: { name: '김유니' } }
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(isSupabaseConfigured ? null : demoUser)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  useEffect(() => {
    if (!supabase) return undefined
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false) })
    return () => data.subscription.unsubscribe()
  }, [])
  const value = useMemo(() => ({ user, loading, demoMode: !isSupabaseConfigured }), [user, loading])
  return createElement(AuthContext.Provider, { value }, children)
}
export function useAuth() { return useContext(AuthContext) }
