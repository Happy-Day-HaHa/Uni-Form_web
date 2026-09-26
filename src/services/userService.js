import { supabase } from './supabase'

export async function getProfile(userId) {
  if (!supabase) return { id: userId, email: 'demo@uniform.test', nickname: '김유니', gender: '응답하지 않음', grade: '3학년', major: '공학', enrollment_status: '재학', role: 'ADMIN', status: 'active', restriction: null }
  await supabase.rpc('refresh_my_restriction').then(() => {}).catch(() => {})
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return { ...data, role: data.role || 'USER', status: data.account_status || data.status || 'active', restriction: data.restriction_category ? { category: data.restriction_category, until: data.restricted_until } : null }
}
export async function saveProfile(profile) {
  if (!supabase) return profile
  const patch = { nickname: profile.nickname, gender: profile.gender, grade: profile.grade, major: profile.major, enrollment_status: profile.enrollment_status }
  const { data, error } = await supabase.from('users').update(patch).eq('id', profile.id).select().single()
  if (error) throw error
  return data
}
