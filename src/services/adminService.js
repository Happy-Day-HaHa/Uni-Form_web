import { supabase } from './supabase'
import { getAllDemoSurveys } from './surveyService'

const members = [
  { id: 'demo-user', nickname: '김유니', email: 'demo@uniform.test', role: 'ADMIN', status: 'active', gender: '응답하지 않음', grade: '3학년', major: '공학', enrollment_status: '재학', created_at: '2026-01-12T09:10:00+09:00', survey_count: 4, response_count: 38, weekly_count: 12, weekly_rank: 4, warning_week: 1, warning_total: 3, team_name: '유니랩' },
  { id: 'mem-2', nickname: '박도현', email: 'dohyun@example.com', role: 'USER', status: 'active', gender: '남성', grade: '2학년', major: '공학', enrollment_status: '재학', created_at: '2026-02-03T13:20:00+09:00', survey_count: 2, response_count: 71, weekly_count: 23, weekly_rank: 1, warning_week: 0, warning_total: 1, team_name: '유니랩' },
  { id: 'mem-3', nickname: '이서진', email: 'seojin@example.com', role: 'USER', status: 'restricted', gender: '여성', grade: '4학년 이상', major: '인문사회', enrollment_status: '재학', created_at: '2026-03-14T10:00:00+09:00', survey_count: 1, response_count: 62, weekly_count: 19, weekly_rank: 2, warning_week: 7, warning_total: 12, restriction_category: '불성실 응답 반복', restricted_until: '2026-10-18T23:59:59+09:00', team_name: '유니랩' },
  { id: 'mem-4', nickname: '최은우', email: 'eunwoo@example.com', role: 'USER', status: 'pending', gender: '응답하지 않음', grade: '1학년', major: '자연과학', enrollment_status: '재학', created_at: '2026-09-22T17:30:00+09:00', survey_count: 0, response_count: 2, weekly_count: 2, weekly_rank: 18, warning_week: 0, warning_total: 0, team_name: '' },
  { id: 'mem-5', nickname: '정하람', email: 'haram@example.com', role: 'STAFF', status: 'active', gender: '여성', grade: '대학원', major: '교육', enrollment_status: '재학', created_at: '2025-11-21T08:40:00+09:00', survey_count: 5, response_count: 54, weekly_count: 17, weekly_rank: 3, warning_week: 5, warning_total: 9, team_name: '리서치메이트' },
  { id: 'mem-6', nickname: '오지안', email: 'jian@example.com', role: 'USER', status: 'withdrawn', gender: '여성', grade: '3학년', major: '상경', enrollment_status: '휴학', created_at: '2025-12-02T11:00:00+09:00', survey_count: 1, response_count: 31, weekly_count: 0, weekly_rank: null, warning_week: 0, warning_total: 2, team_name: '' },
]

const teams = [
  { id: 'team-1', name: '유니랩', leader: '김유니', leader_id: 'demo-user', created_at: '2026-02-18T10:00:00+09:00', members: members.slice(0, 3), survey_count: 4 },
  { id: 'team-2', name: '리서치메이트', leader: '정하람', leader_id: 'mem-5', created_at: '2026-04-02T14:00:00+09:00', members: [members[4]], survey_count: 5 },
]

const seedLogs = [
  { id: 'log-1', created_at: '2026-09-26T10:42:00+09:00', actor_name: '김유니', action: 'response_exclude', target_type: 'survey', target_id: 'demo-survey-1', target_name: 'AI 서비스 사용 경험 조사 · 응답 #21', reason: '동일·무의미 응답', memo: '동일 문구 반복 입력 확인', before_value: '정상', after_value: '운영 제외' },
  { id: 'log-2', created_at: '2026-09-25T16:12:00+09:00', actor_name: '김유니', action: 'member_restrict', target_type: 'member', target_id: 'mem-3', target_name: '이서진', reason: '부정 응답 반복', memo: '30일 제한 및 이메일 안내', before_value: '활성', after_value: '이용 제한' },
]

const rewards = [
  { week: '2026-W39', range: '9.21 ~ 9.27', step: 2, status: '순위 확정', participant_count: 48, tie_count: 2 },
  { week: '2026-W38', range: '9.14 ~ 9.20', step: 5, status: '발송 기록', participant_count: 52, tie_count: 0 },
  { week: '2026-W37', range: '9.7 ~ 9.13', step: 3, status: '동점 추첨 필요', participant_count: 45, tie_count: 3 },
]

const storeKey = 'uniform-admin-demo'
const rewardSentCache = new Map()
function state() { try { return JSON.parse(localStorage.getItem(storeKey) || '{}') } catch { return {} } }
function save(patch) { localStorage.setItem(storeKey, JSON.stringify({ ...state(), ...patch })) }
const delay = (value) => new Promise((resolve) => window.setTimeout(() => resolve(value), 120))
const date = (value) => value ? new Date(value).toLocaleDateString('ko-KR') : '-'
function weekStart(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return new Date(`${value}T00:00:00+09:00`)
  const match = String(value || '').match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null
  const year = Number(match[1]); const week = Number(match[2]); const januaryFourth = new Date(`${year}-01-04T00:00:00+09:00`); const monday = new Date(januaryFourth); monday.setDate(januaryFourth.getDate() - ((januaryFourth.getDay() + 6) % 7) + (week - 1) * 7); return monday
}
function filterWeek(rows, week) { const start = weekStart(week); if (!start) return rows; const end = new Date(start); end.setDate(end.getDate() + 7); return rows.filter((item) => { const submitted = new Date(item.created_at || item.submitted_at); return submitted >= start && submitted < end }) }

function demoSurveys() {
  const current = state(); const overrides = current.surveys || {}; const currentTeams = current.teams || teams
  return getAllDemoSurveys().map((survey, index) => ({
    ...survey, ...overrides[survey.id], owner_name: overrides[survey.id]?.owner_name || currentTeams[index % currentTeams.length]?.name || members[index % members.length].nickname,
    creator_nickname: members[index % members.length].nickname, warning_count: index % 3 === 0 ? index + 1 : index % 2,
    excluded_count: index % 3, created_at: survey.created_at || `2026-09-${String(23 - index).padStart(2, '0')}T10:00:00+09:00`,
    disposal_at: survey.status === 'closed' ? '2026-10-30T00:00:00+09:00' : null,
  }))
}

export const adminFormat = { date }

export async function getAdminSummary() {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_get_summary')
    if (error) throw error
    return data
  }
  const surveys = demoSurveys()
  return delay({ members: { total: members.length, today: 2, week: 9 }, surveys: { total: surveys.length, today: 1, week: 5 }, responses: { total: surveys.reduce((sum, item) => sum + Number(item.response_count || 0), 0), today: 17, week: 136 }, todos: [{ type: 'reward', label: '2026-W37 동점 추첨이 필요해요', to: '/admin/rewards/2026-W37' }, { type: 'member', label: '경고 후 제출 5회 이상 회원 2명', to: '/admin/members?sort=warnings' }] })
}

export async function getAdminSurveys() {
  if (!supabase) return delay(demoSurveys())
  const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function getAdminSurvey(id) { return (await getAdminSurveys()).find((item) => String(item.id) === String(id)) || null }
export async function getAdminResponses(surveyId) {
  if (!supabase) { const excluded = state().excludedResponses || {}; return delay(Array.from({ length: 8 }, (_, index) => ({ id: `${surveyId}-res-${index + 1}`, survey_id: surveyId, respondent_id: members[index % members.length].id, respondent_name: members[index % members.length].nickname, created_at: `2026-09-${String(25 - index).padStart(2, '0')}T${10 + index}:00:00+09:00`, warning_submitted: index % 3 === 0, excluded: excluded[`${surveyId}-res-${index + 1}`] || index === 2, answers: { q1: index % 2 ? '매우 만족' : '만족', q2: '사용 흐름이 편리했어요.' } }))) }
  const { data, error } = await supabase.from('responses').select('*').eq('survey_id', surveyId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function getAdminMembers() {
  if (!supabase) return delay((state().members || members))
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map((item) => ({ ...item, status: item.account_status || item.status, warning_week: item.warning_week || 0, warning_total: item.warning_total || 0 }))
}
export async function getAdminMember(id) { return (await getAdminMembers()).find((item) => String(item.id) === String(id)) || null }
export async function getAdminMemberSurveys(id) { const member = await getAdminMember(id); return (await getAdminSurveys()).filter((item) => String(item.creator_id) === String(id) || item.creator_nickname === member?.nickname) }
export async function getAdminMemberResponses(id, week) {
  if (!supabase) {
    const all = await Promise.all(demoSurveys().slice(0, 4).map((survey) => getAdminResponses(survey.id)))
    return filterWeek(all.flat().filter((item) => String(item.respondent_id) === String(id)).map((item) => ({ ...item, survey_title: demoSurveys().find((survey) => survey.id === item.survey_id)?.title })), week)
  }
  const { data, error } = await supabase.from('responses').select('*, survey:surveys(title)').eq('respondent_id', id).order('created_at', { ascending: false })
  if (error) throw error
  return filterWeek(data.map((item) => ({ ...item, survey_title: item.survey?.title })), week)
}
export async function getAdminTeams() {
  if (!supabase) return delay((state().teams || teams))
  const { data, error } = await supabase.from('teams').select('*, team_members(count)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function getAdminTeam(id) { return (await getAdminTeams()).find((item) => String(item.id) === String(id)) || null }
export async function getAdminTeamSurveys(id) { const team = await getAdminTeam(id); return (await getAdminSurveys()).filter((item) => String(item.team_id) === String(id) || item.owner_name === team?.name) }
export async function getAdminLeaderboard(_week) {
  if (!supabase) return delay([...(state().members || members)].sort((a, b) => b.weekly_count - a.weekly_count).map((item, index, all) => ({ ...item, rank: index && item.weekly_count === all[index - 1].weekly_count ? all[index - 1].rank : index + 1, score: item.weekly_count, last_active: `2026-09-${26 - (index % 5)}` })))
  const { data, error } = await supabase.rpc('admin_get_leaderboard')
  if (error) throw error
  return data.map((item, index, all) => ({ ...item, rank: index && Number(item.score) === Number(all[index - 1].score) ? all[index - 1].rank : index + 1 }))
}
export async function getAdminRewards() {
  if (!supabase) {
    const current = state()
    const leaders = (await getAdminLeaderboard()).filter((entry) => entry.status === 'active' && entry.role !== 'STAFF').slice(0, 3)
    const sent = current.rewardSent || {}
    return delay((current.rewards || rewards).map((item) => ({
      ...item,
      first: leaders[0]?.nickname || '-', second: leaders[1]?.nickname || '-', third: leaders[2]?.nickname || '-',
      sent_count: [1, 2, 3].filter((rank) => sent[`${item.week}:${rank}`]).length,
    })))
  }
  const { data, error } = await supabase.from('reward_weeks').select('*').order('week', { ascending: false })
  if (error) throw error
  return data.map((item) => ({ ...item, range: item.range_label, status: ['응답 확인', '순위 확정', '동점 추첨', '대상 확정', '발송 기록'][item.step - 1] }))
}
export async function getAdminReward(week) {
  const item = (await getAdminRewards()).find((entry) => entry.week === week)
  if (!item) return null
  if (!supabase) return { ...item, winners: (await getAdminLeaderboard()).filter((entry) => entry.status === 'active' && entry.role !== 'STAFF').slice(0, 3) }
  const { data: winners, error } = await supabase.from('reward_winners').select('*, user:users(nickname,email)').eq('week', week).order('rank')
  if (error) throw error
  const mappedWinners = winners.map((entry) => ({ ...entry, nickname: entry.user?.nickname, email: entry.user?.email, reward: entry.reward_text, sentAt: entry.sent_at, score: '-' }))
  mappedWinners.forEach((entry) => { if (entry.sentAt) rewardSentCache.set(`${week}:${entry.rank}`, { reward: entry.reward, sentAt: entry.sentAt }) })
  return { ...item, winners: mappedWinners }
}
export async function getAdminLogs() {
  if (!supabase) return delay([...(state().logs || []), ...seedLogs])
  const { data, error } = await supabase.from('admin_action_logs').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function runAdminAction({ action, targetType, targetId, targetName, reason, memo, payload = {} }) {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_perform_action', { action_name: action, target_type: targetType, target_id: targetId, reason_category: reason, action_memo: memo, action_payload: { ...payload, target_name: targetName }, idempotency_key: crypto.randomUUID() })
    if (error) throw error
    window.dispatchEvent(new CustomEvent('uniform:admin-change', { detail: { action, targetType, targetId } }))
    return data
  }
  const current = state()
  let nextMembers = current.members || members
  let nextTeams = current.teams || teams
  const surveyOverrides = current.surveys || {}
  let beforeValue = ''
  let afterValue = ''
  if (action === 'response_exclude' && current.excludedResponses?.[targetId]) return delay({ ok: true, duplicate: true })
  if (action === 'survey_remove' || action === 'survey_restore') {
    const removed = action === 'survey_remove'
    const sourceSurvey = demoSurveys().find((item) => String(item.id) === String(targetId))
    const restoredStatus = sourceSurvey?.deadline && sourceSurvey.deadline >= new Date().toISOString().slice(0, 10) ? 'active' : 'closed'
    beforeValue = removed ? sourceSurvey?.status || '게시' : '운영 삭제'
    afterValue = removed ? '운영 삭제' : restoredStatus === 'active' ? '모집 중' : '마감'
    surveyOverrides[targetId] = { ...(surveyOverrides[targetId] || {}), status: removed ? 'removed' : restoredStatus, removal_reason: removed ? reason : null, removal_memo: removed ? memo : null, removed_at: removed ? new Date().toISOString() : null, removed_by_name: removed ? '김유니' : null }
  }
  let generatedName = ''
  if (['member_restrict', 'member_unrestrict', 'member_rename', 'member_staff'].includes(action)) nextMembers = nextMembers.map((item) => { if (item.id !== targetId) return item; beforeValue = action === 'member_staff' ? item.role : item.status; if (action === 'member_restrict') { afterValue = '이용 제한'; return { ...item, status: 'restricted', restriction_category: reason, restricted_until: payload.until || null } } if (action === 'member_unrestrict') { afterValue = '활성'; return { ...item, status: 'active', restriction_category: null, restricted_until: null } } if (action === 'member_rename') { generatedName = `회원${Math.floor(10000 + Math.random() * 90000)}`; afterValue = generatedName; return { ...item, nickname: generatedName } } afterValue = item.role === 'STAFF' ? '일반 회원' : '운영팀'; return { ...item, role: item.role === 'STAFF' ? 'USER' : 'STAFF' } })
  if (action === 'team_rename') {
    const renamed = `팀${Math.floor(10000 + Math.random() * 90000)}`
    beforeValue = targetName; afterValue = renamed
    nextTeams = nextTeams.map((item) => item.id === targetId ? { ...item, name: renamed } : item)
    demoSurveys().filter((survey) => survey.owner_name === targetName).forEach((survey) => { surveyOverrides[survey.id] = { ...(surveyOverrides[survey.id] || {}), owner_name: renamed } })
    try { const userTeam = JSON.parse(localStorage.getItem('uni-form-team') || 'null'); if (userTeam && (userTeam.id === targetId || userTeam.name === targetName)) localStorage.setItem('uni-form-team', JSON.stringify({ ...userTeam, name: renamed })) } catch { /* user team storage is optional */ }
  }
  if (action === 'response_exclude' && !current.excludedResponses?.[targetId]) {
    const excluded = { ...(current.excludedResponses || {}), [targetId]: true }
    const responseOwner = targetId.split('-res-')[1]
    const responseIndex = Math.max(0, Number(responseOwner || 1) - 1)
    const respondentId = members[responseIndex % members.length]?.id
    nextMembers = nextMembers.map((item) => item.id === respondentId ? { ...item, weekly_count: Math.max(0, Number(item.weekly_count || 0) - 1), response_count: Math.max(0, Number(item.response_count || 0) - 1) } : item)
    beforeValue = '정상'; afterValue = '운영 제외'
    save({ excludedResponses: excluded })
  }
  const log = { id: crypto.randomUUID(), created_at: new Date().toISOString(), actor_name: '김유니', action, target_type: targetType, target_id: targetId, target_name: targetName, reason, memo, before_value: beforeValue, after_value: afterValue }
  save({ members: nextMembers, teams: nextTeams, surveys: surveyOverrides, logs: [log, ...(current.logs || [])] })
  window.dispatchEvent(new CustomEvent('uniform:admin-change', { detail: { action, targetType, targetId } }))
  return delay({ ok: true, nickname: generatedName || undefined })
}

export async function recordResponseView(response, contextLabel = '응답') {
  if (!response?.id) return { ok: true, duplicate: true }
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_record_response_view', { target_response_id: response.id, idempotency_key: crypto.randomUUID() })
    if (error) throw error
    return data
  }
  const current = state(); const log = { id: crypto.randomUUID(), created_at: new Date().toISOString(), actor_name: '김유니', action: '답변 열람', target_name: `${contextLabel} · ${response.respondent_name || '익명 응답'}`, reason: '운영 확인', memo: '응답 원문 열람', before_value: '', after_value: '열람' }
  save({ logs: [log, ...(current.logs || [])] }); return delay({ ok: true })
}

export async function advanceReward(week) {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_advance_reward', { target_week: week, idempotency_key: crypto.randomUUID() })
    if (error) throw error
    return { ...data, range: data.range_label, status: ['응답 확인', '순위 확정', '동점 추첨', '대상 확정', '발송 기록'][data.step - 1] }
  }
  const list = await getAdminRewards()
  const next = list.map((item) => item.week === week ? { ...item, step: Math.min(5, item.step + 1), status: ['응답 확인', '순위 확정', '동점 추첨', '대상 확정', '발송 기록'][Math.min(4, item.step)] } : item)
  save({ rewards: next })
  return next.find((item) => item.week === week)
}

export async function setRewardCandidateReviewed(week, memberId, reviewed) {
  const current = state(); const reviews = { ...(current.rewardReviews || {}), [`${week}:${memberId}`]: reviewed }; save({ rewardReviews: reviews }); return delay(reviews)
}
export function isRewardCandidateReviewed(week, memberId) { return Boolean(state().rewardReviews?.[`${week}:${memberId}`]) }
export async function markRewardSent(week, rank, { reward, sentAt }) {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_mark_reward_sent', { target_week: week, target_rank: rank, reward_text: reward, sent_at_value: sentAt, idempotency_key: crypto.randomUUID() })
    if (error) throw error
    rewardSentCache.set(`${week}:${rank}`, { reward, sentAt })
    return data
  }
  const current = state(); const sent = { ...(current.rewardSent || {}), [`${week}:${rank}`]: { reward, sentAt } }; const allSent = [1, 2, 3].every((winnerRank) => sent[`${week}:${winnerRank}`]); const nextRewards = (current.rewards || rewards).map((item) => item.week === week ? { ...item, step: 5, status: allSent ? '발송 완료' : '발송 기록' } : item); save({ rewardSent: sent, rewards: nextRewards, logs: [{ id: crypto.randomUUID(), created_at: new Date().toISOString(), actor_name: '김유니', action: 'reward_sent', target_type: 'reward_week', target_id: week, target_name: `${week} ${rank}위`, reason: '주차 정산', memo: reward, before_value: '미발송', after_value: sentAt }, ...(current.logs || [])] }); return delay(sent)
}
export function getRewardSent(week, rank) { return rewardSentCache.get(`${week}:${rank}`) || state().rewardSent?.[`${week}:${rank}`] || null }

export async function getRewardNotice() {
  if (!supabase) return delay(state().notice || { title: '매주 TOP 3 보상 안내', body: '매주 가장 많은 설문에 참여한 상위 3명에게 보상을 드립니다.', tiers: ['1위 · 모바일 상품권 3만원', '2위 · 모바일 상품권 2만원', '3위 · 모바일 상품권 1만원'], tieRule: '동점자는 무작위 추첨으로 선정합니다.' })
  const { data, error } = await supabase.from('reward_notice').select('*').eq('id', true).maybeSingle()
  if (error) throw error
  return data ? { ...data, tieRule: data.tie_rule_text || '' } : { title: '', body: '', tiers: ['', '', ''], tieRule: '' }
}
export async function saveRewardNotice(notice, { reason = '보상 안내 변경', memo = '리더보드 보상 안내 업데이트' } = {}) {
  if (!supabase) { save({ notice }); return delay(notice) }
  const { data, error } = await supabase.rpc('admin_save_reward_notice', { notice_title: notice.title, notice_body: notice.body, notice_tiers: notice.tiers, tie_rule_text_value: notice.tieRule || '', reason_category: reason, action_memo: memo, idempotency_key: crypto.randomUUID() })
  if (error) throw error
  return data
}
