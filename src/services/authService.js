import { supabase } from './supabase'

export async function login({ email, password }) {
  if (!supabase) throw new Error('Supabase 환경변수를 먼저 설정해주세요.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
export async function signup({ email, password, nickname, gender, grade, major, enrollmentStatus }) {
  if (!supabase) throw new Error('Supabase 환경변수를 먼저 설정해주세요.')
  const metadata = { nickname, gender, grade, major, enrollment_status: enrollmentStatus }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
  if (error) throw error
  return data
}
export async function logout() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
