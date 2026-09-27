import { ApiError, apiClient, getAccessToken, getRefreshToken } from './apiClient'
import { getKstDateString } from '../utils/surveyPolicy'
import { getSelectRange } from '../utils/validation'


// ── 백엔드 ↔ 화면 모델 변환 ──────────────────────────────────────────────
// 화면은 기존 화면 데이터 모양(snake_case, 문항 type single/multiple/scale/text/long,
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
// category·estimatedMinutes는 작성자가 입력하지 않았으면 null. 응답 수(responseCount)는 목록·상세에 내려온다(Uniform-backend #39).
// 필드가 없는 응답(이전 버전 서버·캐시)에 대비해 올 때만 채우고, 없으면 undefined로 둔다(화면은 0으로 꾸미지 않고 숨긴다).
export function fromApiSurvey(survey) {
  return {
    id: survey.id,
    title: survey.title || '',
    description: survey.description || '',
    status: STATUS_FROM_API[survey.status] || String(survey.status || '').toLowerCase(),
    target_count: survey.targetCount ?? null,
    category: survey.category ?? null,
    estimated_minutes: survey.estimatedMinutes ?? null,
    ...(survey.responseCount !== undefined ? { response_count: survey.responseCount } : {}),
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
    category: survey.category ?? '',
    estimatedMinutes: survey.estimatedMinutes ?? '',
    deadline: toKstDate(survey.deadlineAt),
    questions: (survey.questions || []).map(fromApiQuestion),
  }
}

function toPositiveInt(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function formToDraftPatch(form, version) {
  const targetCount = Number(form.targetCount)
  return {
    version,
    title: form.title,
    description: form.description || null,
    targetCount: Number.isInteger(targetCount) && targetCount > 0 ? targetCount : null,
    // 둘 다 선택 입력. 비우면 null로 보내 서버 값도 지운다.
    category: form.category?.trim() || null,
    estimatedMinutes: toPositiveInt(form.estimatedMinutes),
    deadlineDate: form.deadline || null,
    questions: form.questions.map(toApiQuestion),
  }
}

function requireSignedIn(message) {
  if (!getAccessToken() && !getRefreshToken()) throw new ApiError({ status: 401, message, code: 'NOT_SIGNED_IN' })
}

// ── 설문 목록 / 상세 ──────────────────────────────────────────────────────
// 목록 필터(서버에서 거른다). estimatedDuration: 'UNDER_3' | 'UNDER_5' | 'OVER_6', 보내지 않으면 전체.
// category는 정확히 일치하는 값만 찾는다. 예상 소요시간을 입력하지 않은 설문은 소요시간 필터에서 빠진다.
function listParams({ cursor, limit, category, estimatedDuration }) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  if (category) params.set('category', category)
  if (estimatedDuration) params.set('estimatedDuration', estimatedDuration)
  return params
}

export async function getSurveyPage({ cursor, limit = 20, category, estimatedDuration } = {}) {
  const data = await apiClient.get(`/surveys?${listParams({ cursor, limit, category, estimatedDuration })}`)
  return { items: data.items.map(fromApiSurvey), nextCursor: data.nextCursor }
}

// 목록 화면이 검색어는 클라이언트에서 거르므로 조건에 맞는 모집 중 설문을 모두 받아온다(최대 maxPages쪽).
export async function getSurveys({ maxPages = 10, category, estimatedDuration } = {}) {
  requireSignedIn('로그인하면 모집 중인 설문을 볼 수 있어요.')
  const surveys = []
  let cursor = null
  for (let page = 0; page < maxPages; page += 1) {
    const result = await getSurveyPage({ cursor, limit: 50, category, estimatedDuration })
    surveys.push(...result.items)
    cursor = result.nextCursor
    if (!cursor) break
  }
  return surveys
}

export async function getSurvey(surveyId) {
  requireSignedIn('로그인하면 설문을 볼 수 있어요.')
  return fromApiSurvey(await apiClient.get(`/surveys/${encodeURIComponent(surveyId)}`))
}

// ── 초안 ──────────────────────────────────────────────────────────
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

// ── FormMate ──────────────────────────────────────────────────────
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
    category: survey.category ?? null,
    estimated_minutes: survey.estimatedMinutes ?? null,
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
  const items = await apiClient.get('/mypage/surveys')
  return items.map(fromApiMySurvey)
}

// 모집 중인 설문만 마감할 수 있다. 응답: 갱신된 내 설문 항목.
export async function closeSurvey(surveyId) {
  const updated = await withMySurveyErrors(() => apiClient.post(`/mypage/surveys/${encodeURIComponent(surveyId)}/close`))
  return fromApiMySurvey(updated, 0)
}

// 백엔드는 임시저장(DRAFT) 설문만 삭제한다(영구 삭제). 게시된 설문은 응답 수와 관계없이 삭제할 수 없다.
export async function deleteSurvey(surveyId) {
  await withMySurveyErrors(() => apiClient.delete(`/surveys/drafts/${encodeURIComponent(surveyId)}`))
}

// 새 초안으로 복사한다(제목·설명·문항만, 목표 인원·마감일은 새로 정해야 함). 응답: { newSurveyId }
// teamId를 주면 그 팀의 팀 초안으로, 없으면 내 개인 초안으로 복사한다(팀으로 복사하려면 그 팀의 현재 팀원이어야 한다).
export async function duplicateSurvey(survey, { teamId } = {}) {
  const body = teamId ? { targetOwnerType: 'team', teamId } : { targetOwnerType: 'user' }
  const { newSurveyId } = await withMySurveyErrors(() => apiClient.post(`/surveys/${encodeURIComponent(survey.id)}/copy`, body))
  return { id: newSurveyId }
}
