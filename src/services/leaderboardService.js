import { apiClient } from './apiClient'
import { getKstDateString } from '../utils/surveyPolicy'

const REWARD_TIERS = [
  { rank: 1, label: '보상은 추후 공지' },
  { rank: 2, label: '보상은 추후 공지' },
  { rank: 3, label: '보상은 추후 공지' },
]

const POLICY_NOTES = [
  '실제 설문에 정상적으로 참여한 응답만 집계됩니다.',
  '중복 응답, 불성실한 응답은 집계에서 제외될 수 있어요.',
  '동점자의 보상 대상자는 무작위 추첨으로 선정됩니다.',
  '운영 기준 변경 시 시즌 시작 전에 공지해요.',
]

// ── 리더보드 ─────────────────────────────────────────────────────────────
// 백엔드 리더보드는 이번 주(KST 월요일 시작)만 있고, 10명씩 최대 5쪽(50위)까지 준다.
// 응답 제출 모달의 순위도 이 API의 myRank를 써서 리더보드 화면과 같은 숫자를 보여준다.
function kstMonthDay(isoString) {
  const [, month, day] = getKstDateString(new Date(isoString)).split('-')
  return `${Number(month)}.${Number(day)}`
}

function apiWeekMeta(weekStart, weekEnd) {
  const remainingMs = Math.max(0, new Date(weekEnd).getTime() - Date.now())
  const remainingHours = Math.floor(remainingMs / 3600000)
  const remainingDays = Math.floor(remainingHours / 24)
  return {
    rangeLabel: `${kstMonthDay(weekStart)} ~ ${kstMonthDay(weekEnd)}`,
    remainingLabel: remainingDays > 0 ? `${remainingDays}일 ${remainingHours % 24}시간 남음` : `${remainingHours}시간 남음`,
  }
}

const toEntry = (item) => ({ rank: item.rank, nickname: item.nickname, score: item.points, lastActiveLabel: item.lastActiveAt ? kstMonthDay(item.lastActiveAt) : '' })

async function getApiLeaderboard() {
  const [first, config] = await Promise.all([apiClient.get('/leaderboard?page=1'), apiClient.get('/leaderboard/rewards/config').catch(() => null)])
  const restPages = Array.from({ length: Math.max(0, first.ranks.totalPages - 1) }, (_, index) => index + 2)
  const rest = await Promise.all(restPages.map((page) => apiClient.get(`/leaderboard?page=${page}`)))
  const entries = [first, ...rest].flatMap((data) => data.ranks.items.map(toEntry))
  const { myRank } = first
  return {
    entries,
    participantCount: first.participantCount,
    // pointsToNext: null이면 전체 1위, 0이면 공동 순위 — 화면의 gapToAbove 규칙과 같다.
    me: myRank.rank ? { rank: myRank.rank, score: myRank.points, gapToAbove: myRank.pointsToNext } : null,
    week: apiWeekMeta(first.weekStart, first.weekEnd),
    // 관리자 콘솔 "보상 안내"에서 입력한 1~3위 보상. 비어 있는 칸은 기본 문구.
    rewards: REWARD_TIERS.map((tier, index) => ({ ...tier, label: config?.tiers?.[index] || tier.label })),
    rewardTitle: config?.title || '',
    rewardText: config?.body || '',
    policyNotes: config?.tieRuleText ? [...POLICY_NOTES.filter((note) => !note.startsWith('동점자')), config.tieRuleText] : POLICY_NOTES,
    lastWeekRank: myRank.previousWeekRank,
    available: true,
  }
}

export async function getLeaderboard() {
  return getApiLeaderboard()
}
