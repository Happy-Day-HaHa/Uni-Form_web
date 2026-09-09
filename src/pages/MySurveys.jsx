import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { demoSurveys, getMySurveys, isDemoSurveyFixture } from '../services/surveyService'

export default function MySurveys() {
  const { user, demoMode } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('latest')
  const [toast, setToast] = useState('')
  const rootRef = useReveal([surveys.length, query, status, sort])

  useEffect(() => {
    getMySurveys(user.id).then((items) => {
      const source = demoMode ? [...items, ...demoSurveys] : items
      setSurveys(Array.from(new Map(source.map((survey) => [survey.id, survey])).values()))
    }).catch(() => setSurveys([]))
  }, [demoMode, user.id])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 1400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const display = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko')
    const filtered = surveys.filter((survey) => {
      const matchesQuery = !keyword || `${survey.title} ${survey.description}`.toLocaleLowerCase('ko').includes(keyword)
      return matchesQuery && (status === 'all' || survey.status === status)
    })
    return [...filtered].sort((a, b) => sort === 'responses'
      ? Number(b.response_count || 0) - Number(a.response_count || 0)
      : String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)))
  }, [query, sort, status, surveys])

  const totalResponses = surveys.reduce((sum, survey) => sum + Number(survey.response_count || 0), 0)
  const completed = surveys.filter((survey) => survey.status !== 'active').length
  const active = surveys.length - completed
  const average = surveys.length ? Math.round(surveys.reduce((sum, survey) => sum + Math.min(100, Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100), 0) / surveys.length) : 0

  async function share(survey) {
    if (!navigator.clipboard) return setToast('주소창의 링크를 복사해주세요.')
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/surveys/${survey.id}`)
      setToast('설문 링크를 복사했습니다.')
    } catch {
      setToast('주소창의 링크를 복사해주세요.')
    }
  }

  return <ServiceShell activePath="/my-surveys"><div ref={rootRef}>
    <ServiceHeading icon="▤" title="내 설문" description="만든 설문을 관리하고 응답 현황과 결과를 확인하세요." action={<Link className="ui-button" to="/surveys/create">새 설문 만들기</Link>} />
    <section className="service-metrics">
      <MetricCard icon="↗" label="진행 중 설문" value={active} unit="개" note="현재 응답을 모집하고 있어요." />
      <MetricCard tone="mint" icon="✓" label="완료된 설문" value={completed} unit="개" note="조사가 완료된 설문이에요." />
      <MetricCard tone="violet" icon="◎" label="총 응답 수" value={totalResponses} unit="명" note="내 설문에 모인 응답이에요." />
      <MetricCard tone="amber" icon="▥" label="평균 응답률" value={average} unit="%" note="목표 응답 대비 평균 수치예요." />
    </section>
    <div className="service-table-tools" data-motion-reveal>
      <input className="service-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="설문 제목이나 설명으로 검색해보세요." />
      <select className="service-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">전체 상태</option><option value="active">진행 중</option><option value="closed">종료</option></select>
      <select className="service-select" value={sort} onChange={(event) => setSort(event.target.value)}><option value="latest">생성일 최신순</option><option value="responses">응답 많은순</option></select>
    </div>
    <section className="managed-list">{display.map((survey, index) => {
      const progress = Math.min(100, Math.round(Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100))
      const isOwned = survey.creator_id === user.id || (demoMode && isDemoSurveyFixture(survey.id))
      return <article className="managed-row ui-card" key={survey.id} data-motion-reveal style={{ '--delay': `${Math.min(index, 5) * 65}ms` }}>
        <div className="managed-row__title"><span className={`service-tone--${['violet', 'amber', 'rose', 'mint', 'blue'][index % 5]}`}>{['◇', '○', '▤', '◎', '✦'][index % 5]}</span><div><h2>{survey.title}</h2><p>{survey.description}</p><small>약 {survey.estimated_minutes || 5}분 · 응답 {Number(survey.response_count || 0).toLocaleString()}명 · {survey.category || '일반'}</small></div></div>
        <div className="managed-progress"><span>{progress}%</span><div><i style={{ '--progress': `${progress}%` }} /></div><small>{Number(survey.response_count || 0).toLocaleString()}명 / {Number(survey.target_count || 0).toLocaleString()}명</small></div>
        <div className="managed-actions"><Link to={`/surveys/${survey.id}`}>{isOwned ? '상세보기' : '미리보기'}</Link>{isOwned && <Link to={`/surveys/${survey.id}/results`}>{survey.response_count > 0 ? '결과보기' : '응답 현황'}</Link>}<button type="button" onClick={() => share(survey)}>공유</button></div>
      </article>
    })}{!display.length && <section className="result-empty"><span>▤</span><h2>조건에 맞는 설문이 없어요.</h2><p>검색어나 상태 필터를 바꿔보세요.</p></section>}</section>
    {toast && <div className="service-toast" role="status">{toast}</div>}
  </div></ServiceShell>
}
