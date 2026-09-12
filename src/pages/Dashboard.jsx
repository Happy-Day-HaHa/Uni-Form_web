import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { demoSurveys, getMySurveys } from '../services/surveyService'

const chartSets = {
  responses: { '7': [72, 98, 112, 136, 162, 148, 121], '30': [84, 126, 105, 168, 142, 190, 176], '90': [96, 132, 158, 144, 201, 218, 196] },
  surveys: { '7': [2, 3, 3, 4, 5, 4, 3], '30': [3, 5, 4, 6, 5, 7, 6], '90': [4, 5, 7, 6, 8, 9, 8] },
}
const labels = ['10/7 (월)', '10/8 (화)', '10/9 (수)', '10/10 (목)', '10/11 (금)', '10/12 (토)', '10/13 (일)']
const activities = [
  ['▤', 'AI 서비스 사용 경험 조사에 참여했어요.', '설문 목록으로 이동합니다.', '2시간 전', '/surveys/ai-campus-use'],
  ['✓', '설문 문항이 정상적으로 제출됐어요.', '캠퍼스 생활 만족도 조사', '3시간 전', '/my-surveys'],
  ['＋', '새로운 설문이 등록됐어요.', '최근 설문을 확인해보세요.', '1일 전', '/my-surveys'],
  ['▥', '설문 결과를 확인했어요.', '분석 보고서를 다시 열 수 있어요.', '2일 전', '/reports'],
]

export default function Dashboard() {
  const { user, demoMode } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metric, setMetric] = useState('responses')
  const [chartLoading, setChartLoading] = useState(false)
  const range = searchParams.get('range') || '7'
  const rootRef = useReveal([surveys.length, loading])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getMySurveys(user.id).then((items) => {
      if (!active) return
      const source = demoMode ? [...items, ...demoSurveys] : items
      setSurveys(Array.from(new Map(source.map((survey) => [survey.id, survey])).values()))
    }).catch(() => active && setError('대시보드 데이터를 불러오지 못했어요.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [demoMode, user.id])

  function changeRange(value) {
    setChartLoading(true)
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set('range', value); return next }, { replace: true })
    window.setTimeout(() => setChartLoading(false), 260)
  }

  const data = chartSets[metric][range] || chartSets[metric]['7']
  const max = Math.max(...data) * 1.12
  const responses = surveys.reduce((sum, survey) => sum + Number(survey.response_count || 0), 0)
  const active = surveys.filter((survey) => survey.status === 'active').length
  const analyzable = surveys.filter((survey) => Number(survey.response_count || 0) > 0).length
  const categories = useMemo(() => {
    const totals = surveys.reduce((acc, survey) => { acc[survey.category || '기타'] = (acc[survey.category || '기타'] || 0) + Number(survey.response_count || 0); return acc }, {})
    const denominator = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => [name, Math.round(value / denominator * 100), value])
  }, [surveys])

  return <ServiceShell activePath="/dashboard"><div ref={rootRef} className="dashboard-final">
    <ServiceHeading icon="▦" title="대시보드" description="지금, 필요한 설문과 주요 활동을 한눈에 확인해보세요." action={<select className="service-select dashboard-range" value={range} onChange={(event) => changeRange(event.target.value)} aria-label="대시보드 기간"><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 3개월</option></select>} />
    {error && <div className="component-error" role="alert">{error}<button type="button" onClick={() => window.location.reload()}>다시 시도</button></div>}
    <section className="service-metrics">
      <MetricCard to="/my-surveys?status=active" icon="▤" label="진행 중인 설문" value={active} unit="개" note="현재 응답을 모으고 있어요." />
      <MetricCard to="/my-surveys?sort=responses" tone="violet" icon="◎" label="누적 응답 수" value={responses} unit="건" note="내 설문에 모인 전체 응답이에요." />
      <MetricCard to="/reports" tone="mint" icon="▥" label="분석 가능한 설문" value={analyzable} unit="개" note="결과를 지금 확인할 수 있어요." />
      <MetricCard to="/surveys" tone="amber" icon="↗" label="이번 주 참여 횟수" value={12} unit="회" note="지난주보다 4회 늘었어요." />
    </section>

    <section className="service-grid dashboard-primary"><article className="service-panel ui-card"><div className="service-panel__head"><div><h2>주간 설문 참여 추이</h2><p>최근 서비스 활동 흐름을 확인할 수 있어요.</p></div><div className="chart-controls" role="group" aria-label="차트 기준"><button className={metric === 'responses' ? 'active' : ''} type="button" onClick={() => setMetric('responses')}>응답 수</button><button className={metric === 'surveys' ? 'active' : ''} type="button" onClick={() => setMetric('surveys')}>설문 수</button></div></div>{chartLoading || loading ? <div className="mini-chart skeleton-block" aria-label="차트 불러오는 중" /> : <div className="mini-chart" aria-label="주간 설문 참여 막대 그래프">{data.map((value, index) => <span key={`${metric}-${range}-${index}`} className={index === 4 ? 'is-current' : ''} title={`${labels[index]} · ${metric === 'responses' ? '응답 수' : '설문 수'} ${value}${metric === 'responses' ? '건' : '개'}`} style={{ '--bar': `${value / max * 100}%`, '--delay': `${index * 25}ms` }}><b>{value}</b><i>{labels[index]}</i></span>)}</div>}</article>
      <article className="service-panel ui-card"><div className="service-panel__head"><div><h2>최근 활동</h2><p>최근에 수행한 활동을 확인해보세요.</p></div><Link to="/reports">전체보기 ›</Link></div><div className="service-list">{activities.map(([icon, title, copy, time, to], index) => <Link className="service-list-row" key={title} to={to}><span className={`service-list-row__icon service-tone--${index % 2 ? 'mint' : 'blue'}`}>{icon}</span><div><h3>{title}</h3><p>{copy}</p></div><time>{time}</time></Link>)}</div></article></section>

    <section className="dashboard-secondary"><article className="service-panel ui-card"><div className="service-panel__head"><div><h2>내 설문 현황</h2><p>최근 만든 설문의 진행 상황이에요.</p></div><Link to="/my-surveys">전체보기 ›</Link></div><div className="dashboard-survey-table">{surveys.slice(0, 5).map((survey) => { const progress = Math.min(100, Math.round(Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100)); return <Link key={survey.id} to={`/my-surveys?survey=${survey.id}`}><b>{survey.title}</b><span className={`status-badge ${progress >= 100 ? 'success' : progress > 50 ? 'active' : 'draft'}`}>{progress >= 100 ? '목표 달성' : progress > 50 ? '진행 중' : '초안'}</span><small>{survey.response_count || 0} / {survey.target_count || 0}</small><i><em style={{ width: `${progress}%` }} /></i><strong>{progress}%</strong></Link>})}</div></article>
      <article className="service-panel ui-card"><div className="service-panel__head"><div><h2>카테고리별 응답 비율</h2><p>전체 응답 {responses.toLocaleString()}건 기준이에요.</p></div></div><div className="category-chart"><div className="category-ring"><strong>{responses.toLocaleString()}</strong><small>총 응답</small></div><ul>{categories.map(([name, percent, count], index) => <li key={name} title={`${name} · ${percent}% · ${count}건`} style={{ '--tone': `var(--chart-${index + 1})` }}><i /><span>{name}</span><b>{percent}%</b></li>)}</ul></div></article>
      <div className="dashboard-stack"><article className="service-panel ui-card"><div className="service-panel__head"><div><h2>빠른 실행</h2><p>자주 사용하는 기능으로 이동하세요.</p></div></div><div className="quick-actions quick-actions--four"><Link to="/formmate">＋ <span>새 설문 만들기</span></Link><Link to="/reports">▥ <span>결과 보기</span></Link><Link to="/surveys">☷ <span>설문 목록</span></Link><Link to="/formmate?new=true">✦ <span>FormMate 시작</span></Link></div></article><article className="service-panel ui-card"><div className="service-panel__head"><div><h2>마감 임박 설문</h2><p>마감이 임박한 설문을 확인하세요.</p></div></div><div className="deadline-list">{surveys.slice(0, 2).map((survey, index) => <Link key={survey.id} to={`/my-surveys?survey=${survey.id}`}><span>!</span><b>{survey.title}</b><em>D-{index * 3 + 2}</em></Link>)}</div></article></div>
    </section>
  </div></ServiceShell>
}
