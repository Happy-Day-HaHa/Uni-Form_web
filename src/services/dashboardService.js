import { apiClient } from './apiClient'

// 대시보드는 API 모드 전용이다(데모 모드는 Dashboard 화면의 기존 샘플 값을 쓴다).
// 모든 값은 요청 시점에 서버가 실시간 집계한다(캐시 없음). 기준은 "내 설문(본인 + 소속 팀)"과 "내 응답 활동"이다.

// 응답: { activeSurveyCount, totalResponses, analyzableSurveyCount, weeklyParticipationCount, weeklyParticipationDelta }
export function getDashboardSummary() {
  return apiClient.get('/dashboard/summary')
}

// 구간 시작일(YYYY-MM-DD, KST) → "9/20 (토)"
function formatBucketLabel(label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label || '')
  if (!match) return label
  const [, year, month, day] = match.map(Number)
  const weekday = '일월화수목금토'[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${month}/${day} (${weekday})`
}

const TREND_RANGE = { 7: '7d', 30: '30d', 90: '3m' }
const TREND_METRIC = { responses: 'response', surveys: 'survey' }

// 항상 7구간. 응답: [{ label, value }]
export async function getDashboardTrend({ range = '7', metric = 'responses' } = {}) {
  const params = new URLSearchParams({ range: TREND_RANGE[range] || '7d', metric: TREND_METRIC[metric] || 'response' })
  const buckets = await apiClient.get(`/dashboard/weekly-trend?${params}`)
  return buckets.map((bucket) => ({ label: formatBucketLabel(bucket.bucketLabel), value: bucket.value }))
}

// 백엔드 알림 targetUrl → 프론트 경로. 프론트에 해당 화면이 없으면 null(링크 없이 표시).
export function toAppPath(targetUrl) {
  if (!targetUrl) return null
  if (targetUrl === '/mypage') return '/my-surveys'
  if (targetUrl.startsWith('/mypage/')) return null // 예: /mypage/responses — 내 응답 목록 화면이 아직 없다
  if (/^\/surveys\/[^/]+$/.test(targetUrl) || targetUrl === '/support') return targetUrl
  return null
}

function relativeTime(isoString) {
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / (60 * 24))}일 전`
}

const ACTIVITY_LABELS = { RESPONSE_SUBMITTED: '설문 응답', SURVEY_PUBLISHED: '설문 게시' }

// 최근 4건 고정. 응답: [{ title, copy, time, to }]
export async function getRecentActivity() {
  const items = await apiClient.get('/dashboard/recent-activity')
  return items.map((item) => ({ title: item.message, copy: ACTIVITY_LABELS[item.type] || '활동', time: relativeTime(item.createdAt), to: toAppPath(item.targetUrl) }))
}
