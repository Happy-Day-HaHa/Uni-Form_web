import { ApiError, apiClient, getAccessToken, getRefreshToken, isApiConfigured } from './apiClient'
import { canDeleteSurvey, getKstDateString, isSurveyOpen } from '../utils/surveyPolicy'
import { getSelectRange } from '../utils/validation'

export const demoSurveys = [
  { id: 'ai-campus-use', creator_id: 'sample-user-3', title: '대학생의 AI 서비스 사용 경험 조사', description: '대학생의 생성형 AI 서비스 이용 경험과 인식을 알아보는 설문입니다.', target_count: 50, response_count: 63, estimated_minutes: 5, deadline: '2026-12-20', category: '테크', status: 'active', questions: [{ id: 'q1', type: 'single', title: '가장 자주 사용하는 AI 서비스는 무엇인가요?', options: ['대화형 AI', '이미지 생성', '번역·요약', '사용하지 않음'] }, { id: 'q2', type: 'scale', title: 'AI 서비스가 학업에 얼마나 도움이 되나요?', min: 1, max: 5 }] },
  { id: 'online-focus', creator_id: 'sample-user-4', title: '온라인 강의 집중도 조사', description: '온라인 강의 수강 시 집중도와 학습 경험에 대한 설문입니다.', target_count: 80, response_count: 59, estimated_minutes: 4, deadline: '2026-11-30', category: '교육', status: 'active', questions: [{ id: 'q1', type: 'scale', title: '온라인 강의에 얼마나 집중할 수 있나요?', min: 1, max: 5 }, { id: 'q2', type: 'text', title: '집중을 방해하는 가장 큰 요인을 알려주세요.' }] },
  { id: 'campus-community', creator_id: 'sample-user-5', title: '학교 커뮤니티 사용 경험 설문', description: '교내 및 온라인 커뮤니티 이용 경험과 만족도를 알아봅니다.', target_count: 90, response_count: 68, estimated_minutes: 4, deadline: '2026-12-10', category: '문화', status: 'active', questions: [{ id: 'q1', type: 'single', title: '학교 커뮤니티를 얼마나 자주 이용하나요?', options: ['매일', '주 2~3회', '가끔', '이용하지 않음'] }] },
  { id: 'campus-life', creator_id: 'demo-user', title: '더 나은 캠퍼스 라이프를 위한 설문', description: '대학생의 공간 이용과 생활 습관을 알아봅니다.', target_count: 100, response_count: 82, estimated_minutes: 4, deadline: '2026-12-31', category: '교육', status: 'active', questions: [{ id: 'q1', type: 'single', title: '캠퍼스에서 가장 자주 이용하는 공간은?', options: ['도서관', '학생회관', '카페', '강의실'] }, { id: 'q2', type: 'scale', title: '현재 캠퍼스 생활에 얼마나 만족하나요?', min: 1, max: 5 }, { id: 'q3', type: 'text', title: '가장 개선되었으면 하는 점을 알려주세요.' }] },
  { id: 'morning-routine', creator_id: 'sample-user-1', title: '나의 아침 루틴과 생산성', description: '하루의 시작을 만드는 작은 습관을 공유해주세요.', target_count: 80, response_count: 27, estimated_minutes: 3, deadline: '2026-10-31', category: '라이프스타일', status: 'active', questions: [{ id: 'q1', type: 'scale', title: '오늘 아침의 만족도는 어떤가요?', min: 1, max: 5 }, { id: 'q2', type: 'text', title: '가장 도움이 되는 아침 습관을 알려주세요.' }] },
  { id: 'eco-choice', creator_id: 'sample-user-2', title: '친환경 소비 선택 조사', description: '환경을 생각하는 소비 기준과 행동을 조사합니다.', target_count: 90, response_count: 54, estimated_minutes: 6, deadline: '2026-11-15', category: '소비', status: 'active', questions: [{ id: 'q1', type: 'single', title: '친환경 제품을 얼마나 자주 구매하나요?', options: ['자주', '가끔', '거의 안 함'] }] },
]

const demoStorageKey = 'uni-form-created-surveys'
export function getDemoCreatedSurveys() {
  try { return JSON.parse(localStorage.getItem(demoStorageKey) || '[]') } catch { return [] }
}
export function getAllDemoSurveys() { return [...getDemoCreatedSurveys(), ...demoSurveys] }
export function isDemoSurveyFixture(surveyId) { return demoSurveys.some((survey) => survey.id === surveyId) }

// ── 백엔드 ↔ 화면 모델 변환 ──────────────────────────────────────────────
// 화면은 기존 데모 데이터 모양(snake_case, 문항 type single/multiple/scale/text/long,
// 보기는 문자열 배열)을 그대로 쓰고, 백엔드와 주고받을 때만 변환한다.
const QUESTION_TYPE_FROM_API = { SINGLE_CHOICE: 'single', MULTI_CHOICE: 'multiple', SCALE: 'scale', SHORT_ANSWER: 'text', NARRATIVE: 'long' }
const QUESTION_TYPE_TO_API = Object.fromEntries(Object.entries(QUESTION_TYPE_FROM_API).map(([api, ui]) => [ui, api]))
const STATUS_FROM_API = { DRAFT: 'draft', RECRUITING: 'active', CLOSED: 'closed', ARCHIVED: 'archived', REMOVED: 'removed' }
export const DEFAULT_SCALE_LABELS = { min: '전혀 그렇지 않다', max: '매우 그렇다' }

// 백엔드 문항(또는 FormMate 제안의 after) → 화면 문항.
// id는 백엔드 stableKey다. serverId가 있는 문항만 PATCH 때 id를 보낸다(새 문항은 id 없이 보내야 함).
export function fromApiQuestion(question) {
  const type = QUESTION_TYPE_FROM_API[question.type] || 'text'
  const options = question.options || []
  return {
    id: question.id || crypto.randomUUID(),
    serverId: question.id || null,
    type,
    title: question.questionText || '',
    required: question.required !== false,
    options: options.map((option) => option.label),
    // 응답 제출은 보기 라벨이 아니라 보기 id로 한다(options와 같은 순서).
    optionIds: options.map((option) => option.id ?? null),
    etcLabel: options.find((option) => option.isEtc)?.label ?? null,
    // 서버 값이 기본값(최소 1, 최대 보기 수)과 같으면 비워 둔다 — 보기를 늘렸을 때 최대값이 예전 보기 수에 묶이지 않게.
    ...(type === 'multiple' ? { minSelect: question.minSelect === 1 ? null : question.minSelect ?? null, maxSelect: question.maxSelect === options.length ? null : question.maxSelect ?? null } : {}),
    ...(type === 'scale' ? { min: 1, max: 5, minLabel: question.minScaleLabel ?? '', maxLabel: question.maxScaleLabel ?? '' } : {}),
  }
}

function toApiQuestion(question) {
  const type = QUESTION_TYPE_TO_API[question.type] || 'SHORT_ANSWER'
  const payload = { type, questionText: question.title || '', required: question.required !== false }
  if (question.serverId) payload.id = question.serverId
  if (type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE') {
    const options = question.options || []
    payload.options = options.map((label) => ({ label, ...(type === 'SINGLE_CHOICE' && question.etcLabel && label === question.etcLabel ? { isEtc: true } : {}) }))
    if (type === 'MULTI_CHOICE') {
      // 입력하지 않은 값은 기본값("1개 이상, 보기 수 이하"). 입력한 값은 그대로 보낸다 — 잘못된 범위는 편집기와 게시 검증이 막는다.
      const { min, max } = getSelectRange(question)
      payload.minSelect = min
      payload.maxSelect = max
    }
  }
  if (type === 'SCALE') {
    payload.minScaleLabel = question.minLabel || ''
    payload.maxScaleLabel = question.maxLabel || ''
  }
  return payload
}

function toKstDate(isoString) { return isoString ? getKstDateString(new Date(isoString)) : '' }

// SurveyResponseDto / SurveyDetailResponseDto / SurveyListItemResponseDto → 화면 설문
// category·estimated_minutes·response_count는 백엔드에 아직 없다.
export function fromApiSurvey(survey) {
  return {
    id: survey.id,
    title: survey.title || '',
    description: survey.description || '',
    status: STATUS_FROM_API[survey.status] || String(survey.status || '').toLowerCase(),
    target_count: survey.targetCount ?? null,
    deadline: toKstDate(survey.deadlineAt),
    created_at: survey.publishedAt || survey.createdAt || null,
    owner_type: survey.ownerType ?? null,
    owner_nickname: survey.ownerNickname ?? null,
    is_owner: survey.isOwner ?? null,
    // 관리(마감·보관 등) 가능 여부. 개인 설문은 isOwner와 같고, 팀 설문은 내가 그 팀의 팀장(해산됐으면 해산 당시 팀장)인지.
    can_manage: survey.canManage ?? null,
    version: survey.version ?? null,
    question_count: survey.questionCount ?? survey.questions?.length ?? 0,
    questions: survey.questions ? survey.questions.map(fromApiQuestion) : undefined,
  }
}

// SurveyCreate의 편집 form ↔ 초안
export function draftToForm(survey) {
  return {
    title: survey.title || '',
    description: survey.description || '',
    targetCount: survey.targetCount ?? 50,
    deadline: toKstDate(survey.deadlineAt),
    questions: (survey.questions || []).map(fromApiQuestion),
  }
}

function formToDraftPatch(form, version) {
  const targetCount = Number(form.targetCount)
  return {
    version,
    title: form.title,
    description: form.description || null,
    targetCount: Number.isInteger(targetCount) && targetCount > 0 ? targetCount : null,
    deadlineDate: form.deadline || null,
    questions: form.questions.map(toApiQuestion),
  }
}

function requireSignedIn(message) {
  if (!getAccessToken() && !getRefreshToken()) throw new ApiError({ status: 401, message, code: 'NOT_SIGNED_IN' })
}

// ── 설문 목록 / 상세 ──────────────────────────────────────────────────────
export async function getSurveyPage({ cursor, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  const data = await apiClient.get(`/surveys?${params}`)
  return { items: data.items.map(fromApiSurvey), nextCursor: data.nextCursor }
}

// 목록 화면이 클라이언트에서 검색·필터를 하므로 모집 중 설문을 모두 받아온다(최대 maxPages쪽).
export async function getSurveys({ maxPages = 10 } = {}) {
  if (!isApiConfigured) return getAllDemoSurveys().filter(isSurveyOpen)
  requireSignedIn('로그인하면 모집 중인 설문을 볼 수 있어요.')
  const surveys = []
  let cursor = null
  for (let page = 0; page < maxPages; page += 1) {
    const result = await getSurveyPage({ cursor, limit: 50 })
    surveys.push(...result.items)
    cursor = result.nextCursor
    if (!cursor) break
  }
  return surveys
}

export async function getSurvey(surveyId) {
  if (!isApiConfigured) return getAllDemoSurveys().find((survey) => survey.id === surveyId) || null
  requireSignedIn('로그인하면 설문을 볼 수 있어요.')
  return fromApiSurvey(await apiClient.get(`/surveys/${encodeURIComponent(surveyId)}`))
}

// ── 초안 (API 모드 전용) ──────────────────────────────────────────────────
// 모두 백엔드 SurveyResponseDto 원본을 돌려준다. 화면 form으로는 draftToForm으로 바꾼다.
export async function createDraft({ title, description } = {}) {
  const payload = { title: title?.trim() || '제목 없는 설문' }
  if (description?.trim()) payload.description = description.trim()
  return apiClient.post('/surveys/drafts', payload)
}

export async function getDraft(surveyId) {
  return apiClient.get(`/surveys/drafts/${encodeURIComponent(surveyId)}`)
}

// 409(버전 충돌)이면 SurveyVersionConflictError를 던진다. latestSurvey에 서버의 최신 초안이 들어 있다.
export class SurveyVersionConflictError extends Error {
  constructor(apiError) {
    super(apiError.message)
    this.name = 'SurveyVersionConflictError'
    this.status = 409
    this.latestSurvey = apiError.data?.latestSurvey ?? null
  }
}

function rethrowConflict(error) {
  if (error instanceof ApiError && error.status === 409 && error.data?.latestSurvey) throw new SurveyVersionConflictError(error)
  throw error
}

// keepalive: 페이지를 떠나는 중(beforeunload)에 보내는 마지막 저장.
export async function updateDraft(surveyId, form, version, { keepalive = false } = {}) {
  try {
    return await apiClient.patch(`/surveys/drafts/${encodeURIComponent(surveyId)}`, formToDraftPatch(form, version), { keepalive })
  } catch (error) {
    return rethrowConflict(error)
  }
}

// 게시 요건 위반이면 400과 함께 위반 항목이 error.messages에 모두 담긴다.
export async function publishDraft(surveyId) {
  const published = await apiClient.post(`/surveys/drafts/${encodeURIComponent(surveyId)}/publish`)
  try { sessionStorage.setItem('uni-form-new-survey', published.id) } catch { /* animation hint is optional */ }
  return published
}

// ── FormMate (API 모드 전용) ──────────────────────────────────────────────
// 응답: { aiReply, proposedChanges: [{ id, type, summary, after }] }
// type: ADD_QUESTION | UPDATE_QUESTION | DELETE_QUESTION | UPDATE_OPTION, DELETE_QUESTION은 after가 null.
export async function sendFormMateMessage(surveyId, message) {
  const data = await apiClient.post(`/surveys/drafts/${encodeURIComponent(surveyId)}/formmate/message`, { message })
  return {
    aiReply: data.aiReply,
    proposedChanges: (data.proposedChanges || []).map((change) => ({ ...change, question: change.after ? fromApiQuestion(change.after) : null })),
  }
}

// 응답: { newVersion }. 적용된 문항 내용은 오지 않으므로 호출 후 getDraft로 다시 불러온다.
// revert: true면 이미 적용한 제안을 되돌린다.
export async function applyFormMateChanges(surveyId, { changeIds, version, revert = false }) {
  try {
    return await apiClient.post(`/surveys/drafts/${encodeURIComponent(surveyId)}/formmate/apply`, { changeIds, version, ...(revert ? { revert: true } : {}) })
  } catch (error) {
    return rethrowConflict(error)
  }
}

// ── 내 설문 (마이페이지) ─────────────────────────────────────────────────
// GET /mypage/surveys 항목(MySurveyResponseDto) → 화면 설문. 본인 설문 + 소속 팀 설문이 함께 온다.
// canManage: 팀 설문은 팀장(해산된 팀이면 해산 당시 팀장)만 true. teamDisbandedAt: 해산된 팀의 설문이면 해산 시각.
function fromApiMySurvey(survey, index) {
  return {
    id: survey.id,
    title: survey.title || '',
    description: '',
    status: STATUS_FROM_API[survey.status] || String(survey.status || '').toLowerCase(),
    owner_type: survey.ownerType,
    owner_name: survey.ownerName,
    can_manage: survey.canManage ?? null,
    team_disbanded_at: survey.teamDisbandedAt ?? null,
    question_count: survey.questionCount,
    response_count: survey.responseCount,
    target_count: survey.targetCount,
    deadline: toKstDate(survey.deadlineAt),
    purge_at: survey.purgeAt,
    // 서버 정렬(만든 시각 최신순)을 유지하기 위한 순번. 목록 DTO에 날짜가 없다.
    list_order: index,
  }
}

// 마이페이지 작업 에러: 서버 문구를 그대로 쓰되, code가 있는 경우만 화면 문구로 바꾼다.
function toMySurveyError(error) {
  if (error instanceof ApiError && error.code === 'SURVEY_NOT_RECRUITING') return new ApiError({ status: error.status, message: '이미 마감되었거나 모집 중이 아닌 설문이에요.', code: error.code, data: error.data })
  return error
}

async function withMySurveyErrors(request) {
  try {
    return await request()
  } catch (error) {
    throw toMySurveyError(error)
  }
}

export async function getMySurveys(userId) {
  if (!isApiConfigured) return getAllDemoSurveys().filter((survey) => survey.creator_id === userId)
  const items = await apiClient.get('/mypage/surveys')
  return items.map(fromApiMySurvey)
}

// 모집 중인 설문만 마감할 수 있다. 응답: 갱신된 내 설문 항목.
export async function closeSurvey(surveyId) {
  if (!isApiConfigured) return updateSurvey(surveyId, { status: 'closed' })
  const updated = await withMySurveyErrors(() => apiClient.post(`/mypage/surveys/${encodeURIComponent(surveyId)}/close`))
  return fromApiMySurvey(updated, 0)
}

// 백엔드는 임시저장(DRAFT) 설문만 삭제한다(영구 삭제). 게시된 설문은 응답 수와 관계없이 삭제할 수 없다.
export async function deleteSurvey(surveyId) {
  if (isApiConfigured) {
    await withMySurveyErrors(() => apiClient.delete(`/surveys/drafts/${encodeURIComponent(surveyId)}`))
    return
  }
  const survey = getDemoCreatedSurveys().find((item) => item.id === surveyId)
  if (!canDeleteSurvey(survey)) throw new Error('임시저장 상태이며 응답이 없는 설문만 삭제할 수 있어요.')
  localStorage.setItem(demoStorageKey, JSON.stringify(getDemoCreatedSurveys().filter((item) => item.id !== surveyId)))
}

// API 모드: 새 초안으로 복사한다(제목·설명·문항만, 목표 인원·마감일은 새로 정해야 함). 응답: { newSurveyId }
// teamId를 주면 그 팀의 팀 초안으로, 없으면 내 개인 초안으로 복사한다(팀으로 복사하려면 그 팀의 현재 팀원이어야 한다).
export async function duplicateSurvey(survey, { teamId } = {}) {
  if (isApiConfigured) {
    const body = teamId ? { targetOwnerType: 'team', teamId } : { targetOwnerType: 'user' }
    const { newSurveyId } = await withMySurveyErrors(() => apiClient.post(`/surveys/${encodeURIComponent(survey.id)}/copy`, body))
    return { id: newSurveyId }
  }
  const futureDeadline = survey.deadline > getKstDateString() ? survey.deadline : getKstDateString(new Date(Date.now() + 30 * 86400000))
  return createSurvey({
    title: `${survey.title} 사본`, description: survey.description, category: survey.category,
    target_count: Math.min(100, survey.target_count), estimated_minutes: survey.estimated_minutes,
    deadline: futureDeadline, questions: survey.questions || [], status: 'draft',
  })
}

// ── 데모 모드 전용 ────────────────────────────────────────────────────────
export async function createSurvey(payload) {
  const survey = { id: crypto.randomUUID(), creator_id: 'demo-user', response_count: 0, status: 'active', ...payload }
  localStorage.setItem(demoStorageKey, JSON.stringify([survey, ...getDemoCreatedSurveys()]))
  try { sessionStorage.setItem('uni-form-new-survey', survey.id) } catch { /* animation hint is optional */ }
  return survey
}

export async function updateSurvey(surveyId, patch) {
  const created = getDemoCreatedSurveys()
  const next = created.map((survey) => survey.id === surveyId ? { ...survey, ...patch, updated_at: new Date().toISOString() } : survey)
  localStorage.setItem(demoStorageKey, JSON.stringify(next))
  return next.find((survey) => survey.id === surveyId) || { id: surveyId, ...patch }
}
