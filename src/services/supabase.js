import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
const authStorage = typeof window === 'undefined' ? undefined : {
  getItem(key) { return localStorage.getItem(key) ?? sessionStorage.getItem(key) },
  setItem(key, value) {
    const remember = localStorage.getItem('uniform-remember-login') === '1'
    const primary = remember ? localStorage : sessionStorage
    const secondary = remember ? sessionStorage : localStorage
    primary.setItem(key, value)
    secondary.removeItem(key)
  },
  removeItem(key) { localStorage.removeItem(key); sessionStorage.removeItem(key) },
}
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey, { auth: { storage: authStorage, persistSession: true } }) : null
