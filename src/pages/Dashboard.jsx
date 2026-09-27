import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { getDashboardSummary, getDashboardTrend, getRecentActivity } from '../services/dashboardService'

export default function Dashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metric, setMetric] = useState('responses')
  const [chartLoading, setChartLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [recent, setRecent] = useState([])
  const [trendError, setTrendError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const range = searchParams.get('range') || '7'
  const rootRef = useReveal([loading])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    Promise.all([getDashboardSummary(), getRecentActivity()])
      .then(([nextSummary, nextRecent]) => { if (active) { setSummary(nextSummary); setRecent(nextRecent) } })
      .catch((reason) => active && setError(`대시보드 데이터를 불러오지 못했어요. ${reason.message}`))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [user.id, reloadKey])

  useEffect(() => {
    let active = true
    setChartLoading(true); setTrendError('')
    getDashboardTrend({ range, metric })
      .then((buckets) => active && setTrend(buckets))
      .catch((reason) => active && setTrendError(`참여 추이를 불러오지 못했어요. ${reason.message}`))
      .finally(() => active && setChartLoading(false))
    return () => { active = false }
  }, [metric, range, reloadKey])

  function changeRange(value) {
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set('range', value); return next }, { replace: true })
  }

  const data = trend.map((bucket) => bucket.value)
  const barLabels = trend.map((bucket) => bucket.label)
  const currentIndex = data.length - 1
  const max = Math.max(1, ...data) * 1.12
  const responses = summary?.totalResponses ?? 0
  const active = summary?.activeSurveyCount ?? 0
  const analyzable = summary?.analyzableSurveyCount ?? 0
  const weekly = summary?.weeklyParticipationCount ?? 0
  const weeklyDelta = summary?.weeklyParticipationDelta ?? 0
  const weeklyNote = weeklyDelta > 0 ? `지난주보다 ${weeklyDelta}회 늘었어요.` : weeklyDelta < 0 ? `지난주보다 ${-weeklyDelta}회 줄었어요.` : '지난주와 같아요.'
  const activityRows = recent

  return <ServiceShell activePath="/dashboard"><div ref={rootRef} className="dashboard-final">
    <ServiceHeading icon="▦" title="대시보드" description="지금, 필요한 설문과 주요 활동을 한눈에 확인해보세요." action={<select className="service-select dashboard-range" value={range} onChange={(event) => changeRange(event.target.value)} aria-label="대시보드 기간"><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 3개월</option></select>} />
    {error && <div className="component-error" role="alert">{error}<button type="button" onClick={() => setReloadKey((key) => key + 1)}>다시 시도</button></div>}
    <nav className="dashboard-core-actions" aria-label="빠른 실행"><Link to="/formmate">FormMate로 설문 만들기</Link><Link to="/my-surveys">내 설문 보기</Link></nav>
    <section className="service-metrics">
      <MetricCard to="/my-surveys?status=active" icon="▤" label="진행 중인 설문" value={active} unit="개" note="현재 응답을 모으고 있어요." />
      <MetricCard to="/my-surveys?sort=responses" tone="violet" icon="◎" label="누적 응답 수" value={responses} unit="건" note="내 설문에 모인 전체 응답이에요." />
      <MetricCard to="/my-surveys?sort=responses" tone="mint" icon="▥" label="분석 가능한 설문" value={analyzable} unit="개" note="내 설문 관리에서 결과를 확인하세요." />
      <MetricCard to="/surveys" tone="amber" icon="↗" label="이번 주 참여 횟수" value={weekly} unit="회" note={weeklyNote} />
    </section>

    <section className="service-grid dashboard-primary"><article className="service-panel ui-card"><div className="service-panel__head"><div><h2>주간 설문 참여 추이</h2><p>내가 설문에 응답한 흐름을 확인할 수 있어요.</p></div><div className="chart-controls" role="group" aria-label="차트 기준"><button className={metric === 'responses' ? 'active' : ''} type="button" onClick={() => setMetric('responses')}>응답 수</button><button className={metric === 'surveys' ? 'active' : ''} type="button" onClick={() => setMetric('surveys')}>설문 수</button></div></div>{trendError ? <p className="form-message form-message--error" role="alert">{trendError}</p> : chartLoading || loading ? <div className="mini-chart skeleton-block" aria-label="차트 불러오는 중" /> : <div className="mini-chart" aria-label="주간 설문 참여 막대 그래프">{data.map((value, index) => <span key={`${metric}-${range}-${index}`} className={index === currentIndex ? 'is-current' : ''} title={`${barLabels[index]} · ${metric === 'responses' ? '응답 수' : '설문 수'} ${value}${metric === 'responses' ? '건' : '개'}`} style={{ '--bar': `${value / max * 100}%`, '--delay': `${index * 25}ms` }}><b>{value}</b><i>{barLabels[index]}</i></span>)}</div>}</article>
      <article className="service-panel ui-card dashboard-activity"><div className="service-panel__head"><div><h2>최근 활동</h2><p>최근에 수행한 활동을 확인해보세요.</p></div><Link className="dashboard-activity__all" to="/my-surveys">전체보기 <span>→</span></Link></div><div className="service-list">{!loading && !activityRows.length && <p className="service-list-empty">아직 활동이 없어요. 설문에 응답하거나 설문을 게시하면 여기에 표시돼요.</p>}{activityRows.map(({ title, copy, time, to }, index) => to ? <Link className="service-list-row" key={`${title}-${index}`} to={to}><div><h3>{title}</h3><p>{copy}</p></div><time>{time}</time></Link> : <div className="service-list-row" key={`${title}-${index}`}><div><h3>{title}</h3><p>{copy}</p></div><time>{time}</time></div>)}</div></article></section>

  </div></ServiceShell>
}
