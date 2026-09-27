import { apiClient } from './apiClient'
import { ENROLLMENT_STATUS, GENDER, GRADE, MAJOR_FIELD } from './authService'
import { fromApiQuestion } from './surveyService'

// 보상 후보 "검토 완료" 체크 표시는 서버 API가 없어 이 브라우저에만 저장한다(관리자 개인 작업 메모).
const REWARD_REVIEWS_KEY = 'uniform-admin-reward-reviews'
const rewardSentCache = new Map()
function readRewardReviews() { try { return JSON.parse(localStorage.getItem(REWARD_REVIEWS_KEY) || '{}') } catch { return {} } }
const date = (value) => value ? new Date(value).toLocaleDateString('ko-KR') : '-'

export const adminFormat = { date }

// ---- NestJS /admin/* 응답 → 관리자 화면 형식 ----
const SURVEY_STATUS = { DRAFT: 'draft', RECRUITING: 'active', CLOSED: 'closed', ARCHIVED: 'archived', REMOVED: 'removed' }
const USER_STATUS = { ACTIVE: 'active', PENDING_VERIFICATION: 'pending', RESTRICTED: 'restricted', WITHDRAWN: 'withdrawn' }
const invert = (map) => Object.fromEntries(Object.entries(map).map(([label, value]) => [value, label]))
const GENDER_LABEL = invert(GENDER)
const GRADE_LABEL = invert(GRADE)
const MAJOR_LABEL = invert(MAJOR_FIELD)
const ENROLLMENT_LABEL = invert(ENROLLMENT_STATUS)
const ACTION_LABELS = {
  survey_remove: '설문 운영 삭제', survey_restore: '설문 복구', member_restrict: '이용 제한', member_unrestrict: '제한 해제',
  member_rename: '닉네임 강제 변경', member_staff: '운영팀 설정', response_exclude: '응답 집계 제외', response_view: '답변 열람',
  team_rename: '팀 이름 강제 변경', reward_advance: '보상 정산 진행', reward_lottery: '동점 추첨', reward_sent: '보상 발송 기록',
  reward_notice_update: '보상 안내 변경',
}
// 저장 시각(UTC) → 한국 날짜 "YYYY-MM-DD"
const kstDate = (value) => value ? new Date(new Date(value).getTime() + 9 * 3600000).toISOString().slice(0, 10) : null
// 브라우저 로컬(한국) 기준 오늘 날짜 — 주차 조회 기본값
const localDateKey = (value = new Date()) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`

function toAdminSurvey(survey) {
  return {
    id: survey.id, title: survey.title, description: survey.description || '', status: SURVEY_STATUS[survey.status] || 'draft',
    owner_name: survey.ownerName, team_id: survey.teamId, creator_id: survey.creatorId, creator_nickname: survey.creatorNickname,
    category: survey.category, response_count: survey.responseCount, target_count: survey.targetCount,
    excluded_count: survey.excludedCount, warning_count: survey.warningCount,
    created_at: survey.publishedAt || survey.createdAt, deadline: kstDate(survey.deadlineAt), disposal_at: survey.purgeAt, purged: survey.purged,
    removal_reason: survey.removal?.reasonCategory ?? null, removal_memo: survey.removal?.memo ?? null,
    removed_by_name: survey.removal?.adminNickname ?? null, removed_at: survey.removal?.removedAt ?? null,
    questions: (survey.questions || []).map(fromApiQuestion),
  }
}
function toAdminResponse(response) {
  return {
    id: response.id, survey_id: response.surveyId, survey_title: response.surveyTitle,
    respondent_id: response.respondentId, respondent_name: response.respondentNickname,
    created_at: response.submittedAt, warning_submitted: response.warningSubmitted, excluded: response.excluded,
    answers: response.answers, questions: response.questions,
  }
}
function toAdminMember(member) {
  return {
    id: member.id, nickname: member.nickname, email: member.email, role: member.role, status: USER_STATUS[member.status] || 'active',
    created_at: member.createdAt, gender: GENDER_LABEL[member.gender] || '', grade: GRADE_LABEL[member.grade] || '',
    major: MAJOR_LABEL[member.majorField] || '', enrollment_status: ENROLLMENT_LABEL[member.enrollmentStatus] || '',
    survey_count: member.surveyCount, response_count: member.responseCount, warning_week: member.warningWeek, warning_total: member.warningTotal,
    weekly_count: member.weeklyCount, weekly_rank: member.weeklyRank, team_name: member.teamNames.join(', '),
    restriction_category: member.restriction?.reason ?? null, restricted_until: member.restriction?.endsAt ?? null,
  }
}
function toAdminTeam(team) {
  return { id: team.id, name: team.name, leader: team.leaderNickname, leader_id: team.leaderId, created_at: team.createdAt, disbanded_at: team.disbandedAt, members: team.members, survey_count: team.surveyCount }
}
function toRewardWeek(item) {
  const nicknameByRank = Object.fromEntries(item.winners.map((winner) => [winner.rank, winner.nickname]))
  return { week: item.week, range: item.range, step: item.step, status: item.stepLabel, participant_count: item.participantCount, tie_count: item.tieCount, first: nicknameByRank[1], second: nicknameByRank[2], third: nicknameByRank[3], sent_count: item.sentCount }
}
function toRewardDetail(detail) {
  const winners = detail.winners.map((winner) => ({ id: winner.userId, rank: winner.rank, nickname: winner.nickname, email: winner.email, reward: winner.reward, sentAt: winner.sentAt }))
  winners.forEach((winner) => { if (winner.sentAt) rewardSentCache.set(`${detail.week}:${winner.rank}`, { reward: winner.reward, sentAt: winner.sentAt }) })
  return { ...toRewardWeek(detail), winners, candidates: detail.candidates.map((candidate) => ({ id: candidate.userId, nickname: candidate.nickname, rank: candidate.rank, score: candidate.points, warning_week: candidate.warningWeek })) }
}
function notifyChange(action, targetType, targetId) { window.dispatchEvent(new CustomEvent('uniform:admin-change', { detail: { action, targetType, targetId } })) }

export async function getAdminSummary() {
  return apiClient.get('/admin/summary')
}

export async function getAdminSurveys() {
  return (await apiClient.get('/admin/surveys')).map(toAdminSurvey)
}
export async function getAdminSurvey(id) {
  return toAdminSurvey(await apiClient.get(`/admin/surveys/${encodeURIComponent(id)}`))
}
export async function getAdminResponses(surveyId) {
  return (await apiClient.get(`/admin/surveys/${encodeURIComponent(surveyId)}/responses`)).map(toAdminResponse)
}
export async function getAdminMembers() {
  return (await apiClient.get('/admin/users')).map(toAdminMember)
}
export async function getAdminMember(id) {
  return toAdminMember(await apiClient.get(`/admin/users/${encodeURIComponent(id)}`))
}
export async function getAdminMemberSurveys(id) {
  return (await getAdminSurveys()).filter((item) => String(item.creator_id) === String(id))
}
export async function getAdminMemberResponses(id, week) {
  const query = week ? `?week=${encodeURIComponent(week)}` : ''
  return (await apiClient.get(`/admin/users/${encodeURIComponent(id)}/responses${query}`)).map(toAdminResponse)
}
export async function getAdminTeams() {
  return (await apiClient.get('/admin/teams')).map(toAdminTeam)
}
export async function getAdminTeam(id) {
  return toAdminTeam(await apiClient.get(`/admin/teams/${encodeURIComponent(id)}`))
}
export async function getAdminTeamSurveys(id) {
  return (await getAdminSurveys()).filter((item) => String(item.team_id) === String(id))
}
// week: 그 주의 아무 날("YYYY-MM-DD"). 없으면 이번 주.
export async function getAdminLeaderboard(week) {
  const data = await apiClient.get(`/admin/leaderboard/weeks/${encodeURIComponent(week || localDateKey())}`)
  return data.ranks.map((item) => ({ id: item.userId, nickname: item.nickname, score: item.points, rank: item.rank, status: USER_STATUS[item.status] || 'active', role: item.role, warning_week: item.warningWeek, last_active: item.lastActiveAt }))
}
export async function getAdminRewards() {
  return (await apiClient.get('/admin/rewards')).map(toRewardWeek)
}
export async function getAdminReward(week) {
  return toRewardDetail(await apiClient.get(`/admin/rewards/${encodeURIComponent(week)}`))
}
export async function getAdminLogs() {
  return (await apiClient.get('/admin/logs')).map((item) => ({
    id: item.id, created_at: item.createdAt, actor_id: item.actorId, actor_name: item.actorName, action: item.action, action_label: ACTION_LABELS[item.action] || item.action,
    target_type: item.targetType, target_id: item.targetId, target_name: item.targetName, reason: item.reason, memo: item.memo, before_value: item.beforeValue, after_value: item.afterValue,
  }))
}

// 관리자 콘솔의 조치 이름 → NestJS 관리자 API.
async function runApiAdminAction({ action, targetId, reason, memo, payload }) {
  const id = encodeURIComponent(targetId)
  switch (action) {
    case 'survey_remove': return apiClient.post(`/admin/surveys/${id}/remove`, { reasonCategory: reason, memo })
    case 'survey_restore': return apiClient.post(`/admin/surveys/${id}/restore`, { reason, memo })
    case 'member_restrict': return apiClient.post(`/admin/users/${id}/restrict`, { reason, memo, ...(payload.days ? { durationDays: payload.days } : {}) })
    case 'member_unrestrict': return apiClient.post(`/admin/users/${id}/restrict`, { reason, memo, lift: true })
    case 'member_rename': return apiClient.post(`/admin/users/${id}/nickname-force-change`, { reason, memo })
    case 'member_staff': return apiClient.post(`/admin/users/${id}/staff`, { reason, memo })
    case 'team_rename': return apiClient.post(`/admin/teams/${id}/rename`, { reason, memo })
    case 'response_exclude': return apiClient.post(`/admin/submissions/${id}/exclude`, { reason, memo })
    default: throw new Error(`지원하지 않는 관리자 조치입니다: ${action}`)
  }
}

export async function runAdminAction({ action, targetType, targetId, reason, memo, payload = {} }) {
  const data = await runApiAdminAction({ action, targetId, reason, memo, payload })
  notifyChange(action, targetType, targetId)
  return data
}
export async function recordResponseView(response) {
  if (!response?.id) return { ok: true, duplicate: true }
  return apiClient.post(`/admin/submissions/${encodeURIComponent(response.id)}/view`)
}

export async function advanceReward(week, { reason = '주차 정산 진행', memo } = {}) {
  return toRewardDetail(await apiClient.post(`/admin/rewards/${encodeURIComponent(week)}/advance`, { reason, memo }))
}

export async function setRewardCandidateReviewed(week, memberId, reviewed) {
  const reviews = { ...readRewardReviews(), [`${week}:${memberId}`]: reviewed }
  try { localStorage.setItem(REWARD_REVIEWS_KEY, JSON.stringify(reviews)) } catch { /* storage is optional */ }
  return reviews
}
export function isRewardCandidateReviewed(week, memberId) { return Boolean(readRewardReviews()[`${week}:${memberId}`]) }
// sentAt: datetime-local 입력값(브라우저 로컬 시각) — 서버에는 ISO로 보낸다.
export async function markRewardSent(week, rank, { reward, sentAt }) {
  return toRewardDetail(await apiClient.post(`/admin/rewards/${encodeURIComponent(week)}/ranks/${rank}/sent`, { reward, sentAt: new Date(sentAt).toISOString() }))
}
export function getRewardSent(week, rank) { return rewardSentCache.get(`${week}:${rank}`) || null }

export async function getRewardNotice() {
  const data = await apiClient.get('/leaderboard/rewards/config', { auth: false })
  return { title: data.title, body: data.body, tiers: [0, 1, 2].map((index) => data.tiers?.[index] || ''), tieRule: data.tieRuleText || '' }
}
export async function saveRewardNotice(notice, { reason = '보상 안내 변경', memo = '리더보드 보상 안내 업데이트' } = {}) {
  return apiClient.patch('/admin/leaderboard/announcement', { title: notice.title, body: notice.body, tiers: notice.tiers, tieRule: notice.tieRule || '', reason, memo })
}
