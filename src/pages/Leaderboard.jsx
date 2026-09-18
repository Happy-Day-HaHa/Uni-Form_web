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

    <div className="leaderboard-layout">
      <div className="leaderboard-main">
        <section className="podium" aria-label="이번 주 TOP 3" data-motion-reveal>
          <p className="podium__caption">더 많은 참여가 더 나은 변화를 만듭니다. 가장 활발히 참여한 유저들을 만나보세요.</p>
          <div className="podium__row">
            <div className="podium__slot podium__slot--second"><div className="podium__avatar podium__avatar--silver">{second.nickname[0]}</div><b>{second.nickname}</b><span>{second.score}회</span><div className="podium__bar podium__bar--silver"><em>2</em></div></div>
            <div className="podium__slot podium__slot--first"><div className="podium__avatar podium__avatar--gold">{first.nickname[0]}</div><b>{first.nickname}</b><span>{first.score}회</span><div className="podium__bar podium__bar--gold"><em>1</em></div></div>
            <div className="podium__slot podium__slot--third"><div className="podium__avatar podium__avatar--bronze">{third.nickname[0]}</div><b>{third.nickname}</b><span>{third.score}회</span><div className="podium__bar podium__bar--bronze"><em>3</em></div></div>
          </div>
        </section>

        <section className="leaderboard-list ui-card" data-motion-reveal>
          <header><h2>4 ~ 50위 랭킹</h2><span>{data.entries.length}명 참여 중</span></header>
          <div className="leaderboard-table__head"><span>순위</span><span>닉네임</span><span>응답 횟수</span><span>최근 활동일</span></div>
          <div className="leaderboard-rows">{rest.map((entry) => <div className={`leaderboard-row ${data.me?.rank === entry.rank ? 'is-me' : ''}`} key={entry.rank}><span>{entry.rank}</span><b>{entry.nickname}</b><strong>{entry.score}회</strong><time>{entry.lastActiveLabel}</time></div>)}</div>
        </section>
      </div>

      <aside className="leaderboard-aside">
        <article className="board-card board-card--reward" data-motion-reveal>
          <h2>보상 안내</h2>
          <p>매주 가장 많은 설문에 참여한 상위 3명에게 소정의 상품을 드립니다.</p>
          <ul className="reward-tiers">{data.rewards.map((item) => <li key={item.rank}><span className={`reward-tiers__rank reward-tiers__rank--${item.rank}`}>{item.rank}</span><b>{item.label}</b></li>)}</ul>
        </article>

        <article className="board-card" data-motion-reveal>
          <h2>운영 기준</h2>
          <ul className="policy-list">{data.policyNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </article>

        <article className={`board-card board-card--me ${!data.me ? 'board-card--empty' : ''}`} data-motion-reveal>
          <h2>내 순위</h2>
          {data.me ? <>
            <strong className="board-card__rank">{data.me.rank}위</strong>
            <p>이번 주 총 <b>{data.me.score}회</b> 참여했어요!</p>
            <span className="board-card__gap">{data.me.gapToAbove === null ? '전체 1위' : data.me.gapToAbove > 0 ? `바로 위와 ${data.me.gapToAbove}회 차이` : '공동 순위'}</span>
            <small>지난주 순위: {data.lastWeekRank ? `${data.lastWeekRank}위` : '기록 없음'}</small>
          </> : <>
            <p>이번 주 첫 응답을 해보세요.</p>
            <Link className="ui-button" to="/surveys">설문 참여하러 가기 →</Link>
          </>}
        </article>
      </aside>
    </div>
  </div></ServiceShell>
}
