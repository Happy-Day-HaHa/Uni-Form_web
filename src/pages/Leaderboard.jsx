import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { getLeaderboard } from '../services/leaderboardService'
import '../styles/leaderboard.css'

export default function Leaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const rootRef = useReveal([loading])

  useEffect(() => {
    let active = true
    getLeaderboard(user.id).then((result) => active && setData(result)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [user.id])

  if (loading || !data) {
    return <ServiceShell activePath="/leaderboard"><div className="leaderboard-skeleton" aria-label="리더보드를 불러오는 중">{[0, 1, 2].map((item) => <div className="skeleton-block" key={item} />)}</div></ServiceShell>
  }

  const [first, second, third] = data.entries
  const rest = data.entries.slice(3, 50)

  return <ServiceShell activePath="/leaderboard"><div ref={rootRef}>
    <ServiceHeading icon="♛" title="응답 횟수 리더보드" description={`이번 주 ${data.week.rangeLabel} · ${data.week.remainingLabel}`} />

    <section className="leaderboard-meta" data-motion-reveal>
      <article><span>이번 주 보상</span><strong>{data.reward}</strong></article>
      <article><span>지난주 내 순위</span><strong>{data.lastWeekRank ? `${data.lastWeekRank}위` : '기록 없음'}</strong></article>
      <article><span>집계 기준</span><strong>설문 응답 1건 = 1점</strong></article>
    </section>

    <section className="podium" aria-label="TOP 3" data-motion-reveal>
      <div className="podium__slot podium__slot--second"><div className="podium__avatar">{second.nickname[0]}</div><b>{second.nickname}</b><span>{second.score}점</span><div className="podium__bar podium__bar--silver">2</div></div>
      <div className="podium__slot podium__slot--first"><span className="podium__crown" aria-hidden="true">♛</span><div className="podium__avatar">{first.nickname[0]}</div><b>{first.nickname}</b><span>{first.score}점</span><div className="podium__bar podium__bar--gold">1</div></div>
      <div className="podium__slot podium__slot--third"><div className="podium__avatar">{third.nickname[0]}</div><b>{third.nickname}</b><span>{third.score}점</span><div className="podium__bar podium__bar--bronze">3</div></div>
    </section>

    <section className="leaderboard-list ui-card" data-motion-reveal>
      <header><h2>4 ~ 50위</h2></header>
      <div className="leaderboard-rows">{rest.map((entry) => <div className={`leaderboard-row ${data.me?.rank === entry.rank ? 'is-me' : ''}`} key={entry.rank}><span>{entry.rank}</span><b>{entry.nickname}</b><strong>{entry.score}점</strong></div>)}</div>
    </section>

    <section className={`my-rank ui-card ${!data.me ? 'my-rank--empty' : ''}`} data-motion-reveal>
      {data.me ? <>
        <div><span>내 순위</span><strong>{data.me.rank}위</strong></div>
        <div><span>이번 주 점수</span><strong>{data.me.score}점</strong></div>
        <div><span>바로 위와 점수 차이</span><strong>{data.me.gapToAbove === null ? '전체 1위' : data.me.gapToAbove > 0 ? `${data.me.gapToAbove}점` : '공동 순위'}</strong></div>
      </> : <>
        <p>이번 주 첫 응답을 해보세요.</p>
        <Link className="ui-button" to="/surveys">설문 참여하러 가기 →</Link>
      </>}
    </section>
  </div></ServiceShell>
}
