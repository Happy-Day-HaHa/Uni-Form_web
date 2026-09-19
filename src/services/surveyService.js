import { supabase } from './supabase'

export const demoSurveys = [
  { id: 'ai-campus-use', creator_id: 'sample-user-3', title: '대학생의 AI 서비스 사용 경험 조사', description: '대학생의 생성형 AI 서비스 이용 경험과 인식을 알아보는 설문입니다.', target_count: 600, response_count: 341, estimated_minutes: 5, category: '테크', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'single', title: '가장 자주 사용하는 AI 서비스는 무엇인가요?', options: ['대화형 AI', '이미지 생성', '번역·요약', '사용하지 않음'] }, { id: 'q2', type: 'scale', title: 'AI 서비스가 학업에 얼마나 도움이 되나요?', min: 1, max: 5 }] },
  { id: 'online-focus', creator_id: 'sample-user-4', title: '온라인 강의 집중도 조사', description: '온라인 강의 수강 시 집중도와 학습 경험에 대한 설문입니다.', target_count: 400, response_count: 279, estimated_minutes: 4, category: '교육', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'scale', title: '온라인 강의에 얼마나 집중할 수 있나요?', min: 1, max: 5 }, { id: 'q2', type: 'text', title: '집중을 방해하는 가장 큰 요인을 알려주세요.' }] },
  { id: 'campus-community', creator_id: 'sample-user-5', title: '학교 커뮤니티 사용 경험 설문', description: '교내 및 온라인 커뮤니티 이용 경험과 만족도를 알아봅니다.', target_count: 500, response_count: 288, estimated_minutes: 4, category: '문화', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'single', title: '학교 커뮤니티를 얼마나 자주 이용하나요?', options: ['매일', '주 2~3회', '가끔', '이용하지 않음'] }] },
  { id: 'campus-life', creator_id: 'demo-user', title: '더 나은 캠퍼스 라이프를 위한 설문', description: '대학생의 공간 이용과 생활 습관을 알아봅니다.', target_count: 120, response_count: 82, estimated_minutes: 4, category: '교육', status: 'active', audience: { age_groups: ['10대', '20대'] }, questions: [{ id: 'q1', type: 'single', title: '캠퍼스에서 가장 자주 이용하는 공간은?', options: ['도서관', '학생회관', '카페', '강의실'] }, { id: 'q2', type: 'scale', title: '현재 캠퍼스 생활에 얼마나 만족하나요?', min: 1, max: 5 }, { id: 'q3', type: 'text', title: '가장 개선되었으면 하는 점을 알려주세요.' }] },
  { id: 'morning-routine', creator_id: 'sample-user-1', title: '나의 아침 루틴과 생산성', description: '하루의 시작을 만드는 작은 습관을 공유해주세요.', target_count: 80, response_count: 27, estimated_minutes: 3, category: '라이프스타일', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'scale', title: '오늘 아침의 만족도는 어떤가요?', min: 1, max: 5 }, { id: 'q2', type: 'text', title: '가장 도움이 되는 아침 습관을 알려주세요.' }] },
  { id: 'eco-choice', creator_id: 'sample-user-2', title: '친환경 소비 선택 조사', description: '환경을 생각하는 소비 기준과 행동을 조사합니다.', target_count: 200, response_count: 154, estimated_minutes: 6, category: '소비', status: 'active', audience: {}, questions: [{ id: 'q1', type: 'single', title: '친환경 제품을 얼마나 자주 구매하나요?', options: ['자주', '가끔', '거의 안 함'] }] },
]

const demoStorageKey = 'uni-form-created-surveys'
export function getDemoCreatedSurveys() {
  try { return JSON.parse(localStorage.getItem(demoStorageKey) || '[]') } catch { return [] }
}
export function getAllDemoSurveys() { return [...getDemoCreatedSurveys(), ...demoSurveys] }
export function isDemoSurveyFixture(surveyId) { return demoSurveys.some((survey) => survey.id === surveyId) }

export async function getSurveys() {
  if (!supabase) return getAllDemoSurveys()
  const { data, error } = await supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function getSurvey(surveyId) {
  if (!supabase) return getAllDemoSurveys().find((survey) => survey.id === surveyId) || null
  const { data, error } = await supabase.from('surveys').select('*').eq('id', surveyId).single()
  if (error) throw error
  return data
}
export async function createSurvey(payload) {
  if (!supabase) {
    const survey = { id: crypto.randomUUID(), creator_id: 'demo-user', response_count: 0, status: 'active', ...payload }
    localStorage.setItem(demoStorageKey, JSON.stringify([survey, ...getDemoCreatedSurveys()]))
    try { sessionStorage.setItem('uni-form-new-survey', survey.id) } catch { /* animation hint is optional */ }
    return survey
  }
  const legacyPayload = { ...payload, reward_points: 1 }
  const { data, error } = await supabase.rpc('create_survey_with_budget', { survey_payload: legacyPayload })
  if (error) throw error
  const createdId = typeof data === 'string' ? data : data?.id
  if (createdId) try { sessionStorage.setItem('uni-form-new-survey', createdId) } catch { /* animation hint is optional */ }
  return data
}

export async function getMySurveys(userId) {
  if (!supabase) return getAllDemoSurveys().filter((survey) => survey.creator_id === userId)
  const { data, error } = await supabase.from('surveys').select('*').eq('creator_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateSurvey(surveyId, patch) {
  if (!supabase) {
    const created = getDemoCreatedSurveys()
    const next = created.map((survey) => survey.id === surveyId ? { ...survey, ...patch, updated_at: new Date().toISOString() } : survey)
    localStorage.setItem(demoStorageKey, JSON.stringify(next))
    return next.find((survey) => survey.id === surveyId) || { id: surveyId, ...patch }
  }
  const { data, error } = await supabase.from('surveys').update(patch).eq('id', surveyId).select().single()
  if (error) throw error
  return data
}

export async function deleteSurvey(surveyId) {
  if (!supabase) {
    localStorage.setItem(demoStorageKey, JSON.stringify(getDemoCreatedSurveys().filter((survey) => survey.id !== surveyId)))
    return
  }
  const { error } = await supabase.from('surveys').delete().eq('id', surveyId)
  if (error) throw error
}

export async function duplicateSurvey(survey) {
  return createSurvey({
    title: `${survey.title} 사본`, description: survey.description, category: survey.category,
    target_count: survey.target_count, estimated_minutes: survey.estimated_minutes,
    questions: survey.questions || [], audience: survey.audience || {}, visibility: survey.visibility || '전체 공개', status: 'draft',
  })
}
