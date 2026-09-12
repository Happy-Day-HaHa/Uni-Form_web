import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { deleteSurvey, demoSurveys, duplicateSurvey, getMySurveys, isDemoSurveyFixture, updateSurvey } from '../services/surveyService'

function surveyState(survey) {
  const progress = Math.round(Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100)
  if (survey.status === 'draft') return ['draft', '초안']
  if (progress >= 100) return ['success', '목표 달성']
  if (survey.status === 'closed' || progress >= 60) return ['analysis', '분석 가능']
  if (progress > 0 && progress < 45) return ['stalled', '응답 정체']
  return ['active', '진행 중']
}

export default function MySurveys() {
  const { user, demoMode } = useAuth()
  const [params, setParams] = useSearchParams()
  const [surveys, setSurveys] = useState([])
  const [query, setQuery] = useState(params.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [status, setStatus] = useState(params.get('status') || 'all')
  const [sort, setSort] = useState(params.get('sort') || 'latest')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [menuId, setMenuId] = useState('')
  const [confirmSurvey, setConfirmSurvey] = useState(null)
  const menuRef = useRef(null)
  const rootRef = useReveal([surveys.length, debouncedQuery, status, sort])

  useEffect(() => { getMySurveys(user.id).then((items) => { const source = demoMode ? [...items, ...demoSurveys] : items; setSurveys(Array.from(new Map(source.map((survey) => [survey.id, survey])).values())) }).finally(() => setLoading(false)) }, [demoMode, user.id])
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query), 260); return () => window.clearTimeout(timer) }, [query])
  useEffect(() => { const next = {}; if (debouncedQuery) next.q = debouncedQuery; if (status !== 'all') next.status = status; if (sort !== 'latest') next.sort = sort; setParams(next, { replace: true }) }, [debouncedQuery, setParams, sort, status])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 1800); return () => window.clearTimeout(timer) }, [toast])
  useEffect(() => { const close = (event) => !menuRef.current?.contains(event.target) && setMenuId(''); document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close) }, [])

  const display = useMemo(() => {
    const keyword = debouncedQuery.trim().toLocaleLowerCase('ko')
    const filtered = surveys.filter((survey) => {
      const [key] = surveyState(survey)
      return (!keyword || `${survey.title} ${survey.description} ${survey.category}`.toLocaleLowerCase('ko').includes(keyword)) && (status === 'all' || key === status)
    })
    return [...filtered].sort((a, b) => sort === 'responses' ? Number(b.response_count || 0) - Number(a.response_count || 0) : String(b.updated_at || b.created_at || b.id).localeCompare(String(a.updated_at || a.created_at || a.id)))
  }, [debouncedQuery, sort, status, surveys])

  const totalResponses = surveys.reduce((sum, survey) => sum + Number(survey.response_count || 0), 0)
  const counts = surveys.reduce((result, survey) => { result[surveyState(survey)[0]] += 1; return result }, { active: 0, stalled: 0, analysis: 0, success: 0, draft: 0 })
  const notify = (value) => setToast(value)

  async function share(survey) {
    try { await navigator.clipboard.writeText(`${window.location.origin}/surveys/${survey.id}`); notify('설문 링크를 복사했습니다.') } catch { notify('주소창의 링크를 복사해주세요.') }
    setMenuId('')
  }
  async function duplicate(survey) { const copy = await duplicateSurvey(survey); setSurveys((current) => [copy, ...current]); notify('설문을 복제했습니다.'); setMenuId('') }
  async function closeSurvey(survey) { await updateSurvey(survey.id, { status: 'closed' }); setSurveys((current) => current.map((item) => item.id === survey.id ? { ...item, status: 'closed' } : item)); notify('설문 모집을 종료했습니다.'); setMenuId('') }
  async function remove() { const survey = confirmSurvey; await deleteSurvey(survey.id); setSurveys((current) => current.filter((item) => item.id !== survey.id)); setConfirmSurvey(null); notify('설문을 삭제했습니다.') }

  return <ServiceShell activePath="/my-surveys"><div ref={rootRef}>
    <ServiceHeading icon="▤" title="내 설문" description="만든 설문을 관리하고 응답 현황과 다음 액션을 확인하세요." action={<Link className="ui-button" to="/formmate">✦ FormMate로 설문 만들기</Link>} />
    <section className="service-metrics">
      <MetricCard icon="↗" label="진행 중 설문" value={counts.active} unit="개" note="현재 응답을 수집하고 있어요." />
      <MetricCard tone="amber" icon="!" label="검토 필요" value={counts.stalled} unit="개" note="응답이 저조한 설문이 있어요." />
      <MetricCard tone="violet" icon="▥" label="분석 가능" value={counts.analysis + counts.success} unit="개" note="분석할 수 있는 데이터가 모였어요." />
      <MetricCard tone="mint" icon="♣" label="누적 응답 수" value={totalResponses} unit="명" note="지금까지 수집된 모든 응답이에요." />
    </section>
    <div className="service-table-tools" data-motion-reveal>
      <input className="service-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="설문 제목, 설명, 카테고리로 검색하세요." aria-label="내 설문 검색" />
      <select className="service-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="상태"><option value="all">전체 상태</option><option value="active">진행 중</option><option value="stalled">응답 정체</option><option value="analysis">분석 가능</option><option value="success">목표 달성</option><option value="draft">초안</option></select>
      <select className="service-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="정렬"><option value="latest">최근 수정순</option><option value="responses">응답 많은순</option></select>
    </div>
    {loading ? <div className="catalog-skeleton" aria-label="설문을 불러오는 중">{Array.from({ length: 4 }, (_, index) => <div key={index}><span /><p /><i /></div>)}</div> : <section className="managed-list">{display.map((survey, index) => {
      const progress = Math.min(100, Math.round(Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100))
      const [stateKey, stateLabel] = surveyState(survey)
      const isOwned = survey.creator_id === user.id || (demoMode && isDemoSurveyFixture(survey.id))
      return <article className="managed-row ui-card" key={survey.id} data-motion-reveal style={{ '--delay': `${Math.min(index, 4) * 50}ms` }}>
        <div className="managed-row__title"><span className={`service-tone--${['violet', 'amber', 'rose', 'mint', 'blue'][index % 5]}`}>{['◇', '○', '▤', '◎', '✦'][index % 5]}</span><div><div className="managed-title-line"><h2>{survey.title}</h2><em className={`survey-state survey-state--${stateKey}`}>{stateLabel}</em></div><p>{survey.description}</p><small>{survey.category || '일반'} · 약 {survey.estimated_minutes || 5}분</small></div></div>
        <div className="managed-progress"><span>{Number(survey.response_count || 0).toLocaleString()} / {Number(survey.target_count || 0).toLocaleString()}명 <b>{progress}%</b></span><div><i style={{ '--progress': `${progress}%` }} /></div><small>{progress >= 100 ? '목표를 달성했어요! 🎉' : `목표까지 ${Math.max(0, Number(survey.target_count || 0) - Number(survey.response_count || 0))}명 남았어요.`}</small></div>
        <div className="managed-actions"><Link className="managed-primary" to={isOwned && survey.response_count > 0 ? `/surveys/${survey.id}/results` : `/surveys/${survey.id}`}>{isOwned ? '관리하기' : '미리보기'}</Link><div className="row-menu" ref={menuId === survey.id ? menuRef : null}><button type="button" aria-label="설문 메뉴" aria-expanded={menuId === survey.id} onClick={() => setMenuId(menuId === survey.id ? '' : survey.id)}>•••</button>{menuId === survey.id && <div className="row-menu__popover"><button type="button" onClick={() => share(survey)}>링크 복사</button><button type="button" onClick={() => duplicate(survey)}>복제하기</button><button type="button" onClick={() => closeSurvey(survey)}>모집 종료</button><button className="is-danger" type="button" onClick={() => { setConfirmSurvey(survey); setMenuId('') }}>삭제하기</button></div>}</div></div>
      </article>
    })}{!display.length && <section className="result-empty"><span>▤</span><h2>조건에 맞는 설문이 없어요.</h2><p>검색 조건을 초기화하거나 FormMate로 새 설문을 만들어보세요.</p><button className="ui-button ui-button--secondary" type="button" onClick={() => { setQuery(''); setStatus('all'); setSort('latest') }}>필터 초기화</button></section>}</section>}
    <Modal open={Boolean(confirmSurvey)} title="설문을 삭제할까요?" onClose={() => setConfirmSurvey(null)}><p>‘{confirmSurvey?.title}’ 설문은 삭제 후 복구할 수 없습니다.</p><div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setConfirmSurvey(null)}>취소</button><button className="ui-button ui-button--danger" onClick={remove}>삭제</button></div></Modal>
    {toast && <div className="service-toast" role="status">✓ {toast}</div>}
  </div></ServiceShell>
}
