const nicknames = [
  '하윤서', '박도현', '이서진', '최은우', '정하람', '김도윤', '오지안', '윤서준',
  '강나은', '조은결', '임소율', '한지호', '신유담', '배시온', '류하준', '문채원',
  '서지훈', '남궁솔', '전민서', '황리안', '홍서율', '곽태윤', '노아린', '표준하',
  '설수아', '유이현', '고은채', '변지우', '엄시우', '탁하은', '차유준', '주다은',
  '기서아', '반예준', '지수민', '팽하율', '용지안', '옥서연', '견도현', '진하윤',
  '방소민', '함은서', '마준서', '길다인', '어윤재', 'piano_kim', 'cs_do', 'ee_nam',
  '동아리장민', '새내기유담',
]

function seededScore(index) {
  const base = Math.max(1, 132 - index * 2.6)
  const jitter = ((index * 37) % 11) - 5
  return Math.max(1, Math.round(base + jitter))
}

function buildWeeklyEntries() {
  const scores = nicknames.map((nickname, index) => ({ nickname, score: seededScore(index) })).sort((a, b) => b.score - a.score)
  return scores.map((entry, index) => ({ rank: index + 1, ...entry }))
}

export function getWeekMeta() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  const format = (date) => `${date.getMonth() + 1}.${date.getDate()}`
  const remainingMs = Math.max(0, nextMonday.getTime() - now.getTime())
  const remainingHours = Math.floor(remainingMs / 3600000)
  const remainingDays = Math.floor(remainingHours / 24)
  const remainingLabel = remainingDays > 0 ? `${remainingDays}일 ${remainingHours % 24}시간 남음` : `${remainingHours}시간 남음`
  return { rangeLabel: `${format(monday)} ~ ${format(nextMonday)}`, remainingLabel }
}

export async function getLeaderboard(userId, { myWeeklyScore = 7 } = {}) {
  const entries = buildWeeklyEntries()

  let me = null
  if (myWeeklyScore > 0) {
    const insertAt = entries.findIndex((entry) => entry.score < myWeeklyScore)
    const rank = insertAt === -1 ? entries.length + 1 : insertAt + 1
    const aboveEntry = rank > 1 ? entries[rank - 2] : null
    me = { userId, rank, score: myWeeklyScore, gapToAbove: aboveEntry ? aboveEntry.score - myWeeklyScore : null }
  }

  return {
    entries,
    me,
    week: getWeekMeta(),
    reward: 'TOP 10 스타벅스 아메리카노 기프티콘',
    lastWeekRank: myWeeklyScore > 0 ? 31 : null,
  }
}
