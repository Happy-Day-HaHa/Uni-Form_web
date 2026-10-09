import { BETA_START } from '../config/beta'
import { getKstDateString } from './surveyPolicy'

// 리더보드 주차 계산(한국 시간 날짜 "YYYY-MM-DD" 기준). 백엔드 규칙과 같다:
// 베타 1주차는 BETA_START부터 그다음 주 일요일까지, 이후에는 월요일 00:00 ~ 일요일 24:00.
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const toMs = (date) => { const [year, month, day] = date.split('-').map(Number); return Date.UTC(year, month - 1, day) }
const addDays = (date, days) => new Date(toMs(date) + days * DAY_MS).toISOString().slice(0, 10)
const weekdayOf = (date) => new Date(toMs(date)).getUTCDay()
const mondayOf = (date) => addDays(date, -((weekdayOf(date) + 6) % 7))

export function getBetaFirstWeek() {
  const firstMonday = weekdayOf(BETA_START) === 1 ? BETA_START : addDays(mondayOf(BETA_START), 7)
  const end = addDays(firstMonday, 6)
  return { start: BETA_START, end, days: (toMs(end) - toMs(BETA_START)) / DAY_MS + 1 }
}

// now가 속한 리더보드 주차. 베타 시작 전이면 1주차를 돌려준다.
export function getLeaderboardWeek(now = new Date()) {
  const today = getKstDateString(now)
  const first = getBetaFirstWeek()
  if (today <= first.end) return { number: 1, start: first.start, end: first.end, isFirstWeek: true }
  const start = mondayOf(today)
  return { number: 2 + (toMs(start) - toMs(addDays(first.end, 1))) / (7 * DAY_MS), start, end: addDays(start, 6), isFirstWeek: false }
}

export const formatMonthDay = (date) => `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}`
export const formatKoreanDate = (date) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일(${WEEKDAYS[weekdayOf(date)]})`

// 고객센터 FAQ "리더보드는 언제 초기화되나요?" 답변
export function getLeaderboardResetRule() {
  const first = getBetaFirstWeek()
  return `베타 1주차는 ${formatKoreanDate(first.start)}부터 ${formatKoreanDate(first.end)}까지 ${first.days}일간 집계되고, 이후에는 매주 월요일 00:00(한국 시간)에 새 주간 순위가 시작됩니다.`
}

// 랜딩 리더보드 미리보기의 기간 문구. 1주차에는 "매주 월요일 초기화"가 1주차 예외와 부딪히지 않게 다음 초기화일을 밝힌다.
export function getLeaderboardWeekLabel(now = new Date()) {
  const week = getLeaderboardWeek(now)
  const range = `베타 ${week.number}주차 ${formatMonthDay(week.start)} ~ ${formatMonthDay(week.end)}`
  return week.isFirstWeek ? `${range} · ${formatMonthDay(addDays(week.end, 1))}(월)부터 매주 월요일 초기화` : `${range} · 매주 월요일 00:00 초기화`
}
