import { ApiError, apiClient, isApiConfigured } from './apiClient'
import { getAllDemoSurveys, getSurvey, isDemoSurveyFixture } from './surveyService'

const textSamples = ['사용 흐름이 더 단순해지면 좋겠어요.', '모바일에서도 편하게 참여하고 싶어요.', '결과를 한눈에 비교할 수 있으면 좋겠습니다.', '지금 구성도 전반적으로 만족스러워요.', '안내 문구가 조금 더 구체적이면 좋겠어요.']
const demoRespondedKey = 'uni-form-demo-responded-surveys'

// 응답을 제출한 설문 id 목록. API 모드에서는 GET /mypage/responses 중 SUBMITTED만 쓴다.
export async function getRespondedSurveyIds(userId) {
  if (!userId) return []
  if (!isApiConfigured) {
    try { return JSON.parse(localStorage.getItem(demoRespondedKey) || '[]') } catch { return [] }
  }
  const items = await apiClient.get('/mypage/responses')
  return [...new Set(items.filter((item) => item.status === 'SUBMITTED').map((item) => item.surveyId))]
}

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

// ── 응답 에러 분류 ───────────────────────────────────────────────────────
// reason은 백엔드 에러 code와 같은 이름을 쓴다. 중복 응답과 마감은 둘 다 409라 code로 구분한다.
const RESPONSE_ERROR_CODES = ['ALREADY_RESPONDED', 'SURVEY_NOT_RECRUITING', 'OWNER_CANNOT_RESPOND']
const RESPONSE_ERROR_MESSAGES = {
  ALREADY_RESPONDED: '이미 응답을 완료한 설문입니다.',
  SURVEY_NOT_RECRUITING: '마감되었거나 모집 중이 아닌 설문이라 응답할 수 없어요.',
  OWNER_CANNOT_RESPOND: '본인(또는 우리 팀)이 만든 설문에는 응답할 수 없어요.',
  ACCOUNT_NOT_ACTIVE: '이메일 인증을 마친 활성 회원만 응답할 수 있어요.',
  NOT_SIGNED_IN: '로그인이 필요해요. 다시 로그인한 뒤 시도해주세요.',
  NOT_FOUND: '설문을 찾을 수 없습니다. 삭제되었거나 주소가 올바르지 않아요.',
  NETWORK: '서버에 연결할 수 없어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
}

export class ResponseError extends Error {
  constructor(reason, message, cause) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ResponseError'
    this.reason = reason
    this.messages = cause?.messages?.length ? cause.messages : [message]
  }
}

// code가 없는 예전 백엔드 응답용: 메시지 문구로 추정한다.
function reasonFromMessage(error) {
  const text = error.messages.join(' ')
  if (error.status === 409 && text.includes('이미 응답')) return 'ALREADY_RESPONDED'
  if (error.status === 409 && text.includes('모집 중')) return 'SURVEY_NOT_RECRUITING'
  if (error.status === 403 && text.includes('응답할 수 없습니다')) return 'OWNER_CANNOT_RESPOND'
  return null
}

function toResponseError(error) {
  if (!(error instanceof ApiError)) return error
  let reason = null
  if (RESPONSE_ERROR_CODES.includes(error.code)) reason = error.code
  else if (error.status === 0) reason = 'NETWORK'
  else if (error.status === 401) reason = 'NOT_SIGNED_IN'
  else if (error.status === 404) reason = 'NOT_FOUND'
  // 비활성 계정 403은 백엔드가 code를 주지 않아 문구로만 구분한다.
  else if (error.status === 403 && error.messages.join(' ').includes('활성 회원')) reason = 'ACCOUNT_NOT_ACTIVE'
  else reason = reasonFromMessage(error)
  // 400(답변 검증 실패)은 서버가 준 문항별 사유를 그대로 보여준다.
  if (!reason) return new ResponseError(error.status === 400 ? 'INVALID_ANSWERS' : 'UNKNOWN', error.messages.join(' · '), error)
  return new ResponseError(reason, RESPONSE_ERROR_MESSAGES[reason], error)
}

async function withResponseErrors(request) {
  try {
    return await request()
  } catch (error) {
    throw toResponseError(error)
  }
}

// ── 답변 형식 변환 ───────────────────────────────────────────────────────
// 화면(QuestionItem)은 보기 라벨로 답을 들고, 백엔드는 보기 id로 받는다.
//   단일선택 { optionId, etcText? } · 복수선택 [optionId] · 척도 number · 단답/서술 string
// 기타(직접 입력) 내용은 화면에서 answers[etcAnswerKey(questionId)]에 따로 둔다.
export const etcAnswerKey = (questionId) => `${questionId}:etc`

function optionIdOf(question, label) {
  const index = (question.options || []).indexOf(label)
  return index === -1 ? null : question.optionIds?.[index] ?? null
}

function toApiAnswers(survey, answers) {
  const result = {}
  for (const question of survey.questions || []) {
    const value = answers[question.id]
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) continue
    if (question.type === 'single') {
      const optionId = optionIdOf(question, value)
      if (!optionId) continue
      const etcText = question.etcLabel && value === question.etcLabel ? (answers[etcAnswerKey(question.id)] || '').trim() : ''
      result[question.id] = etcText ? { optionId, etcText } : { optionId }
    } else if (question.type === 'multiple') {
      result[question.id] = value.map((label) => optionIdOf(question, label)).filter(Boolean)
    } else if (question.type === 'scale') {
      result[question.id] = Number(value)
    } else {
      result[question.id] = String(value)
    }
  }
  return result
}

function fromApiAnswers(survey, savedAnswers) {
  const answers = {}
  for (const { questionId, value } of savedAnswers || []) {
    const question = (survey.questions || []).find((item) => item.id === questionId)
    if (!question || value === null || value === undefined) continue
    const labelOf = (optionId) => question.options?.[question.optionIds?.indexOf(optionId)]
    if (question.type === 'single' && value?.optionId) {
      answers[question.id] = labelOf(value.optionId)
      if (value.etcText) answers[etcAnswerKey(question.id)] = value.etcText
    } else if (question.type === 'multiple' && Array.isArray(value)) {
      answers[question.id] = value.map(labelOf).filter(Boolean)
    } else {
      answers[question.id] = value
    }
  }
  return answers
}

// ── 응답 세션 (API 모드) ─────────────────────────────────────────────────
// 설문당 사용자 세션은 하나다. 진행 중인 세션이 있으면 이어서 쓰고, 임시저장된 답을 화면 형식으로 돌려준다.
export async function startResponseSession(survey) {
  if (!isApiConfigured) return { sessionId: null, answers: {} }
  const session = await withResponseErrors(() => apiClient.post(`/surveys/${encodeURIComponent(survey.id)}/sessions`))
  return { sessionId: session.sessionId, answers: fromApiAnswers(survey, session.savedAnswers) }
}

// 제출 전 임시저장. 응답 수·점수에는 반영되지 않는다.
export async function saveResponseAnswers(survey, sessionId, answers, { keepalive = false } = {}) {
  if (!isApiConfigured || !sessionId) return
  await withResponseErrors(() => apiClient.patch(`/surveys/${encodeURIComponent(survey.id)}/sessions/${encodeURIComponent(sessionId)}/answers`, { answers: toApiAnswers(survey, answers) }, { keepalive }))
}

// API 모드 응답: { success, pointsEarned, weeklyRank }. 같은 세션을 다시 제출해도 점수는 한 번만 준다.
export async function submitSurveyResponse(surveyId, answers, { survey, sessionId, sameScaleWarningAcknowledged = false } = {}) {
  if (!isApiConfigured) {
    const ids = await getRespondedSurveyIds('demo-user')
    if (ids.includes(surveyId)) throw new ResponseError('ALREADY_RESPONDED', RESPONSE_ERROR_MESSAGES.ALREADY_RESPONDED)
    localStorage.setItem(demoRespondedKey, JSON.stringify([...ids, surveyId]))
    return { response_id: crypto.randomUUID() }
  }
  return withResponseErrors(() => apiClient.post(`/surveys/${encodeURIComponent(surveyId)}/sessions/${encodeURIComponent(sessionId)}/submit`, { answers: toApiAnswers(survey, answers), sameScaleWarningAcknowledged }))
}

// ── 결과 ─────────────────────────────────────────────────────────────────
// 백엔드 문항 결과 → 결과 화면이 쓰는 분석 형태 { type, values, responseCount, counts, average, max }
function toAnalysis(question, result) {
  if (!result) return { type: question.type === 'long' || question.type === 'text' ? 'text' : question.type, values: [], responseCount: 0, counts: [], average: null, max: 1 }
  if (question.type === 'text' || question.type === 'long') return { type: 'text', values: result.answers || [], responseCount: result.responseCount }
  const counts = question.type === 'scale'
    ? (result.scaleCounts || []).map((item) => ({ option: item.score, count: item.count }))
    : (result.options || []).map((item) => ({ option: item.label, count: item.count }))
  return {
    type: question.type,
    values: [],
    responseCount: result.responseCount,
    counts,
    average: question.type === 'scale' && result.responseCount ? result.average : null,
    max: Math.max(1, ...counts.map((item) => item.count)),
    etcAnswers: result.etcAnswers || [],
  }
}

// API 모드: 결과 조회 권한(등록자 또는 팀원)은 백엔드가 판단한다(403 → FORBIDDEN).
// 반환: { survey, responses: [], responseCount, excludedCount, analyses } — 집계는 서버가 한다.
async function getApiSurveyResults(surveyId) {
  try {
    const [survey, result] = await Promise.all([getSurvey(surveyId), apiClient.get(`/surveys/${encodeURIComponent(surveyId)}/result`)])
    const resultByQuestionId = new Map(result.questions.map((item) => [item.questionId, item]))
    return {
      survey: { ...survey, response_count: result.responseCount, target_count: result.targetCount ?? survey.target_count },
      responses: [],
      responseCount: result.responseCount,
      excludedCount: result.excludedCount,
      dailyTrend: result.dailyTrend,
      analyses: (survey.questions || []).map((question) => toAnalysis(question, resultByQuestionId.get(question.id))),
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) throw new ResultAccessError('FORBIDDEN', '이 결과를 확인할 권한이 없습니다.', error)
    if (error instanceof ApiError && error.status === 404) throw new ResultAccessError('NOT_FOUND', '설문을 찾을 수 없습니다.', error)
    throw new ResultAccessError('NETWORK', '결과를 불러오지 못했습니다.', error)
  }
}

export async function getOwnedSurveyResults(surveyId, userId) {
  if (isApiConfigured) return getApiSurveyResults(surveyId)
  const survey = getAllDemoSurveys().find((item) => item.id === surveyId)
  if (!survey) throw new ResultAccessError('NOT_FOUND', '설문을 찾을 수 없습니다.')
  const canAccess = survey.creator_id === userId || (userId === 'demo-user' && isDemoSurveyFixture(survey.id))
  if (!canAccess) throw new ResultAccessError('FORBIDDEN', '이 결과를 확인할 권한이 없습니다.')
  const responses = createDemoResponses(survey)
  return { survey: { ...survey, response_count: responses.length }, responses, responseCount: responses.length }
}
