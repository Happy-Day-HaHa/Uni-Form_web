// TODO(백엔드 연동 다음 단계): apiClient로 교체 전까지는 데모 데이터 분기로 동작한다.
const supabase = null

export async function getProfile(userId) {
  if (!supabase) return { id: userId, nickname: '김유니', gender: '응답하지 않음', grade: '3학년', major: '공학', enrollment_status: '재학' }
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}
export async function saveProfile(profile) {
  if (!supabase) return profile
  const patch = { nickname: profile.nickname, gender: profile.gender, grade: profile.grade, major: profile.major, enrollment_status: profile.enrollment_status }
  const { data, error } = await supabase.from('users').update(patch).eq('id', profile.id).select().single()
  if (error) throw error
  return data
}
