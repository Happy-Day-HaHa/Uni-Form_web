import { supabase } from './supabase'
import { demoSurveys } from './surveyService'

const demoResponses = [
  { id: 'demo-response-1', survey_id: 'campus-life', respondent_id: 'student-1', answers: { q1: '도서관', q2: 4, q3: '열람실 좌석과 콘센트가 더 많았으면 좋겠어요.' } },
  { id: 'demo-response-2', survey_id: 'campus-life', respondent_id: 'student-2', answers: { q1: '카페', q2: 3, q3: '조용하게 팀플할 수 있는 공간이 필요해요.' } },
  { id: 'demo-response-3', survey_id: 'campus-life', respondent_id: 'student-3', answers: { q1: '도서관', q2: 5, q3: '도서관 운영 시간이 더 길어지면 좋겠습니다.' } },
  { id: 'demo-response-4', survey_id: 'campus-life', respondent_id: 'student-4', answers: { q1: '학생회관', q2: 4, q3: '휴식 공간과 충전 공간을 늘려주세요.' } },
  { id: 'demo-response-5', survey_id: 'campus-life', respondent_id: 'student-5', answers: { q1: '도서관', q2: 3, q3: '빈 강의실을 스터디 공간으로 쓰고 싶어요.' } },
]

export async function submitSurveyResponse(surveyId, answers) {
  if (!supabase) return { response_id: crypto.randomUUID() }
  const { data, error } = await supabase.rpc('submit_survey_response', { target_survey_id: surveyId, submitted_answers: answers })
  if (error) throw error
  return data
}
export async function getSurveyResponses(surveyId) {
  if (!supabase) return []
  const { data, error } = await supabase.from('responses').select('*').eq('survey_id', surveyId)
  if (error) throw error
  return data
}

export async function getOwnedSurveyResults(surveyId, userId) {
  if (!supabase) {
    const survey = demoSurveys.find((item) => item.id === surveyId && item.creator_id === userId)
    if (!survey) throw new Error('본인이 만든 설문의 결과만 확인할 수 있어요.')
    if (!survey.response_count) throw new Error('응답이 들어오면 결과 분석을 확인할 수 있어요.')
    return { survey, responses: demoResponses.filter((response) => response.survey_id === surveyId) }
  }

  const { data: survey, error: surveyError } = await supabase.from('surveys').select('*').eq('id', surveyId).eq('creator_id', userId).single()
  if (surveyError || !survey) throw new Error('본인이 만든 설문의 결과만 확인할 수 있어요.')
  if (!survey.response_count) throw new Error('응답이 들어오면 결과 분석을 확인할 수 있어요.')
  const { data: responses, error: responseError } = await supabase.from('responses').select('*').eq('survey_id', surveyId).order('created_at', { ascending: false })
  if (responseError) throw responseError
  return { survey, responses }
}
