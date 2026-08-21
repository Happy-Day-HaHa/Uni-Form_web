import { supabase } from './supabase'

export async function getProfile(userId) {
  if (!supabase) return { id: userId, name: '김유니', age_group: '20대', region: '서울', interests: ['교육', '라이프스타일'], point_balance: 4200 }
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}
export async function saveProfile(profile) {
  if (!supabase) return profile
  const { data, error } = await supabase.from('users').upsert(profile).select().single()
  if (error) throw error
  return data
}
