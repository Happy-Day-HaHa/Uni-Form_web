import { supabase } from './supabase'
import { getAllDemoSurveys, isDemoSurveyFixture } from './surveyService'

const textSamples = ['사용 흐름이 더 단순해지면 좋겠어요.', '모바일에서도 편하게 참여하고 싶어요.', '결과를 한눈에 비교할 수 있으면 좋겠습니다.', '지금 구성도 전반적으로 만족스러워요.', '안내 문구가 조금 더 구체적이면 좋겠어요.']

function createDemoResponses(survey) {
  return Array.from({ length: Number(survey.response_count || 0) }, (_, index) => ({
    id: `${survey.id}-response-${index + 1}`,
    survey_id: survey.id,
    respondent_id: `demo-respondent-${index + 1}`,
    created_at: new Date(Date.UTC(2026, 7, 1 + (index % 28), 9 + (index % 10))).toISOString(),
    answers: Object.fromEntries((survey.questions || []).map((question, questionIndex) => {
      if (String(question.type).includes('text')) return [question.id, textSamples[(index + questionIndex) % textSamples.length]]
      if (question.type === 'scale') return [question.id, Number(question.min || 1) + ((index * 3 + questionIndex) % (Number(question.max || 5) - Number(question.min || 1) + 1))]
      const options = question.options || []
      if (question.type === 'multiple') return [question.id, options.filter((_, optionIndex) => (index + optionIndex) % 3 === 0).slice(0, 2)]
      return [question.id, options.length ? options[(index * 2 + questionIndex) % options.length] : '응답']
    })),
  }))
}

export class ResultAccessError extends Error {
  constructor(code, message, cause) { super(message, cause ? { cause } : undefined); this.name = 'ResultAccessError'; this.code = code }
}

export async function submitSurveyResponse(surveyId, answers) {
  if (!supabase) return { response_id: crypto.randomUUID() }
  const { data, error } = await supabase.rpc('submit_survey_response', { target_survey_id: surveyId, submitted_answers: answers })
  if (error) throw error
  return data
}
export async function getSurveyResponses(surveyId) {
  if (!supabase) {
    const survey = getAllDemoSurveys().find((item) => item.id === surveyId)
    return survey ? createDemoResponses(survey) : []
  }
  const { data, error } = await supabase.from('responses').select('*').eq('survey_id', surveyId)
  if (error) throw error
  return data
}

export async function getOwnedSurveyResults(surveyId, userId) {
  if (!supabase) {
    const survey = getAllDemoSurveys().find((item) => item.id === surveyId)
    if (!survey) throw new ResultAccessError('NOT_FOUND', '설문을 찾을 수 없습니다.')
    const canAccess = survey.creator_id === userId || (userId === 'demo-user' && isDemoSurveyFixture(survey.id))
    if (!canAccess) throw new ResultAccessError('FORBIDDEN', '이 결과를 확인할 권한이 없습니다.')
    const responses = createDemoResponses(survey)
    return { survey: { ...survey, response_count: responses.length }, responses }
  }

  const { data: survey, error: surveyError } = await supabase.from('surveys').select('*').eq('id', surveyId).maybeSingle()
  if (surveyError) throw new ResultAccessError('NETWORK', '결과를 불러오지 못했습니다.', surveyError)
  if (!survey) throw new ResultAccessError('NOT_FOUND', '설문을 찾을 수 없습니다.')
  if (survey.creator_id !== userId) throw new ResultAccessError('FORBIDDEN', '이 결과를 확인할 권한이 없습니다.')
  const { data: responses, error: responseError } = await supabase.from('responses').select('*').eq('survey_id', surveyId).order('created_at', { ascending: false })
  if (responseError) throw new ResultAccessError('NETWORK', '결과를 불러오지 못했습니다.', responseError)
  return { survey: { ...survey, response_count: responses.length }, responses }
}
