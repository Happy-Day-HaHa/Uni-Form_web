import { supabase } from './supabase'

export const demoSurveys = [
  { id: 'campus-life', creator_id: 'demo-user', title: '더 나은 캠퍼스 라이프를 위한 설문', description: '대학생의 공간 이용과 생활 습관을 알아봅니다.', target_count: 120, response_count: 82, estimated_minutes: 4, category: '교육', status: 'active', audience: { age_groups: ['10대', '20대'] }, questions: [{ id: 'q1', type: 'single', title: '캠퍼스에서 가장 자주 이용하는 공간은?', options: ['도서관', '학생회관', '카페', '강의실'] }, { id: 'q2', type: 'scale', title: '현재 캠퍼스 생활에 얼마나 만족하나요?', min: 1, max: 5 }, { id: 'q3', type: 'text', title: '가장 개선되었으면 하는 점을 알려주세요.' }] },
  { id: 'morning-routine', creator_id: 'sample-user-1', title: '나의 아침 루틴과 생산성', description: '하루의 시작을 만드는 작은 습관을 공유해주세요.', target_count: 80, response_count: 27, estimated_minutes: 3, category: '라이프스타일', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'scale', title: '오늘 아침의 만족도는 어떤가요?', min: 1, max: 5 }, { id: 'q2', type: 'text', title: '가장 도움이 되는 아침 습관을 알려주세요.' }] },
  { id: 'eco-choice', creator_id: 'sample-user-2', title: '친환경 소비 선택 조사', description: '환경을 생각하는 소비 기준과 행동을 조사합니다.', target_count: 200, response_count: 154, estimated_minutes: 6, category: '소비', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'single', title: '친환경 제품을 얼마나 자주 구매하나요?', options: ['자주', '가끔', '거의 안 함'] }] },
]

const demoStorageKey = 'uni-form-created-surveys'
function getDemoCreatedSurveys() {
  try { return JSON.parse(localStorage.getItem(demoStorageKey) || '[]') } catch { return [] }
}
function getAllDemoSurveys() { return [...getDemoCreatedSurveys(), ...demoSurveys] }

export async function getSurveys() {
  if (!supabase) return getAllDemoSurveys()
  const { data, error } = await supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function getSurvey(surveyId) {
  if (!supabase) return getAllDemoSurveys().find((survey) => survey.id === surveyId) || demoSurveys[0]
  const { data, error } = await supabase.from('surveys').select('*').eq('id', surveyId).single()
  if (error) throw error
  return data
}
export async function createSurvey(payload) {
  if (!supabase) {
    const survey = { id: crypto.randomUUID(), creator_id: 'demo-user', response_count: 0, status: 'active', ...payload }
    localStorage.setItem(demoStorageKey, JSON.stringify([survey, ...getDemoCreatedSurveys()]))
    return survey
  }
  const legacyPayload = { ...payload, reward_points: 1 }
  const { data, error } = await supabase.rpc('create_survey_with_budget', { survey_payload: legacyPayload })
  if (error) throw error
  return data
}

export async function getMySurveys(userId) {
  if (!supabase) return getAllDemoSurveys().filter((survey) => survey.creator_id === userId)
  const { data, error } = await supabase.from('surveys').select('*').eq('creator_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}
