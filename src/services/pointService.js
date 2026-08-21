import { supabase } from './supabase'

export async function getPointBalance(userId) {
  if (!supabase) return 4200
  const { data, error } = await supabase.from('users').select('point_balance').eq('id', userId).single()
  if (error) throw error
  return data.point_balance
}
export async function getPointTransactions() {
  if (!supabase) return [{ id: 1, type: 'survey_reward', amount: 320, created_at: new Date().toISOString() }, { id: 2, type: 'survey_funding', amount: -1500, created_at: new Date(Date.now() - 86400000).toISOString() }]
  const { data, error } = await supabase.from('point_transactions').select('*').order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  return data
}
