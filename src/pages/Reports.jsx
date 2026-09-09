import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { demoSurveys, getMySurveys } from '../services/surveyService'

export default function Reports() {
  const rootRef = useReveal([])
  const { user, demoMode } = useAuth()
  const [owned, setOwned] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getMySurveys(user.id)
      .then((surveys) => {
        if (!active) return
        const source = demoMode ? [...surveys, ...demoSurveys] : surveys
        setOwned(Array.from(new Map(source.map((survey) => [survey.id, survey])).values()))
      })
      .catch(() => active && setOwned([]))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [demoMode, user.id])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 1400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const reports = useMemo(() => owned.filter((survey) => Number(survey.response_count || 0) > 0), [owned])
  const totalResponses = reports.reduce((sum, survey) => sum + Number(survey.response_count || 0), 0)
  const averageCompletion = reports.length
    ? Math.round(reports.reduce((sum, survey) => sum + Math.min(100, Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100), 0) / reports.length)
    : 0

  async function share(survey) {
    const url = `${window.location.origin}/surveys/${survey.id}`
    if (!navigator.clipboard) {
      setToast('주소창의 링크를 복사해주세요.')
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setToast('설문 링크를 복사했습니다.')
    } catch {
      setToast('주소창의 링크를 복사해주세요.')
    }
  }

  return <ServiceShell activePath="/reports"><div ref={rootRef}>
    <ServiceHeading icon="▥" title="결과 보고서" description="모인 응답을 핵심 지표와 문항별 결과로 빠르게 확인하세요." />
    <section className="service-metrics">
      <MetricCard icon="◎" label="전체 응답" value={totalResponses} unit="건" note="분석 가능한 누적 응답이에요." />
      <MetricCard tone="mint" icon="✓" label="완료된 분석" value={reports.length} unit="개" note="결과가 준비된 설문이에요." />
      <MetricCard tone="violet" icon="▥" label="진행 중 설문" value={reports.filter((survey) => survey.status === 'active').length} unit="개" note="현재 응답을 모으고 있어요." />
      <MetricCard tone="amber" icon="↗" label="평균 완료율" value={averageCompletion} unit="%" note="목표 응답 대비 평균 수치예요." />
    </section>

    {loading ? <section className="managed-list" aria-label="결과 목록을 불러오는 중">{[0, 1, 2].map((item) => <div className="managed-row skeleton-block" key={item} />)}</section>
      : reports.length === 0 ? <section className="result-empty"><span>▥</span><h2>아직 확인할 결과가 없어요.</h2><p>설문에 첫 응답이 들어오면 문항별 결과가 여기에 표시됩니다.</p><Link className="ui-button" to="/my-surveys">내 설문 확인하기</Link></section>
        : <section className="managed-list">{reports.slice(0, 8).map((survey, index) => {
          const progress = Math.round(Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100)
          return <article className="managed-row ui-card" data-motion-reveal style={{ '--delay': `${Math.min(index, 5) * 60}ms` }} key={survey.id}>
            <div className="managed-row__title"><span className={`service-tone--${['blue', 'violet', 'mint', 'amber', 'rose'][index % 5]}`}>▥</span><div><h2>{survey.title}</h2><p>{survey.description}</p><small>응답 {Number(survey.response_count || 0).toLocaleString()}건 · {survey.category}</small></div></div>
            <div className="managed-progress"><span>{progress}%</span><div><i style={{ '--progress': `${Math.min(100, progress)}%` }} /></div><small>목표 {Number(survey.target_count || 0).toLocaleString()}명</small></div>
            <div className="managed-actions"><Link to={`/surveys/${survey.id}/results`}>결과 보기</Link><button type="button" onClick={() => share(survey)}>공유</button></div>
          </article>
        })}</section>}
    {toast && <div className="service-toast" role="status">{toast}</div>}
  </div></ServiceShell>
}
