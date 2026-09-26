import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { isApiConfigured } from '../services/apiClient'
import { closeSurvey, deleteSurvey, duplicateSurvey, getMySurveys } from '../services/surveyService'
import { canDeleteSurvey, getSurveyLifecycleStatus, isTargetReached } from '../utils/surveyPolicy'

function surveyState(survey) {
  const status = getSurveyLifecycleStatus(survey)
  return [status, { draft: '임시저장', active: '모집 중', closed: '마감', archived: '보관' }[status]]
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
  const [closeConfirmSurvey, setCloseConfirmSurvey] = useState(null)
  // loadError: 목록을 못 불러옴 · actionError: 복제 등 모달 밖 작업 실패 · modalError: 마감/삭제 모달 안 실패
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [modalError, setModalError] = useState('')
  const [busy, setBusy] = useState(false)
  const menuRef = useRef(null)
  const rootRef = useReveal([surveys.length, debouncedQuery, status, sort])

  const loadSurveys = useCallback(() => {
    setLoadError('')
    return getMySurveys(user.id).then(setSurveys).catch((error) => setLoadError(`내 설문을 불러오지 못했어요. ${error.message}`)).finally(() => setLoading(false))
  }, [user.id])
  useEffect(() => { loadSurveys() }, [demoMode, loadSurveys])
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
    return [...filtered].sort((a, b) => sort === 'responses' ? Number(b.response_count || 0) - Number(a.response_count || 0) : (a.list_order ?? 0) - (b.list_order ?? 0) || String(b.updated_at || b.created_at || b.id).localeCompare(String(a.updated_at || a.created_at || a.id)))
  }, [debouncedQuery, sort, status, surveys])

  const totalResponses = surveys.reduce((sum, survey) => sum + Number(survey.response_count || 0), 0)
  const counts = surveys.reduce((result, survey) => { result[surveyState(survey)[0]] += 1; return result }, { active: 0, closed: 0, archived: 0, draft: 0 })
  const notify = (value) => setToast(value)

  async function share(survey) {
    try { await navigator.clipboard.writeText(`${window.location.origin}/surveys/${survey.id}`); notify('설문 링크를 복사했습니다.') } catch { notify('주소창의 링크를 복사해주세요.') }
    setMenuId('')
  }
  async function duplicate(survey) {
    setMenuId('')
    setActionError('')
    try {
      const copy = await duplicateSurvey(survey)
      // API 모드는 새 초안 id만 오므로 목록을 다시 불러온다.
      if (isApiConfigured) await loadSurveys()
      else setSurveys((current) => [copy, ...current])
      notify(isApiConfigured ? '설문을 복제했어요. 임시저장에서 이어서 편집할 수 있어요.' : '설문을 복제했습니다.')
    } catch (error) {
      setActionError(`‘${survey.title}’ 설문을 복제하지 못했어요. ${error.message}`)
    }
  }
  async function confirmClose() {
    const survey = closeConfirmSurvey
    try {
      setBusy(true)
      setModalError('')
      const updated = await closeSurvey(survey.id)
      setSurveys((current) => current.map((item) => item.id === survey.id ? { ...item, ...(isApiConfigured ? { ...updated, list_order: item.list_order } : {}), status: 'closed' } : item))
      setCloseConfirmSurvey(null)
      notify('설문 모집을 종료했습니다.')
      setMenuId('')
    } catch (error) {
      setModalError(error.message || '설문을 마감하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    const survey = confirmSurvey
    try {
      setBusy(true)
      setModalError('')
      await deleteSurvey(survey.id)
      setSurveys((current) => current.filter((item) => item.id !== survey.id))
      setConfirmSurvey(null)
      notify('설문을 삭제했습니다.')
    } catch (error) {
      setModalError(error.message || '설문을 삭제하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }
  const closeModals = () => { setConfirmSurvey(null); setCloseConfirmSurvey(null); setModalError('') }

  return <ServiceShell activePath="/my-surveys"><div ref={rootRef}>
    <ServiceHeading icon="▤" title="내 설문" description="만든 설문을 관리하고 응답 현황과 다음 액션을 확인하세요." action={<Link className="ui-button" to="/formmate">FormMate로 설문 만들기</Link>} />
    {(loadError || actionError) && <div className="component-error" role="alert">{loadError || actionError}{loadError ? <button type="button" onClick={() => { setLoading(true); loadSurveys() }}>다시 시도</button> : <button type="button" onClick={() => setActionError('')}>닫기</button>}</div>}
    <section className="service-metrics">
      <MetricCard icon="↗" label="모집 중" value={counts.active} unit="개" note="현재 응답을 수집하고 있어요." />
      <MetricCard tone="amber" icon="!" label="마감" value={counts.closed} unit="개" note="모집이 종료된 설문이에요." />
      <MetricCard tone="violet" icon="▥" label="임시저장" value={counts.draft} unit="개" note="작성 중인 설문이에요." />
      <MetricCard tone="mint" icon="♣" label="누적 응답 수" value={totalResponses} unit="명" note="지금까지 수집된 모든 응답이에요." />
    </section>
    <div className="service-table-tools" data-motion-reveal>
      <input className="service-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="설문 제목, 설명, 카테고리로 검색하세요." aria-label="내 설문 검색" />
      <select className="service-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="상태"><option value="all">전체 상태</option><option value="draft">임시저장</option><option value="active">모집 중</option><option value="closed">마감</option><option value="archived">보관</option></select>
      <select className="service-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="정렬"><option value="latest">최근 수정순</option><option value="responses">응답 많은순</option></select>
    </div>
    {loading ? <div className="catalog-skeleton" aria-label="설문을 불러오는 중">{Array.from({ length: 4 }, (_, index) => <div key={index}><span /><p /><i /></div>)}</div> : <section className="managed-list">{display.map((survey, index) => {
      const progress = Math.min(100, Math.round(Number(survey.response_count || 0) / Math.max(1, Number(survey.target_count || 1)) * 100))
      const [stateKey, stateLabel] = surveyState(survey)
      // 팀 설문: 마감·관리 화면은 백엔드 canManage(팀장)만, 팀원은 결과 보기만 가능하다.
      const isTeamSurvey = survey.owner_type === 'TEAM'
      const canManage = !isTeamSurvey || survey.can_manage === true
      const teamLabel = survey.team_disbanded_at ? '해산된 팀' : canManage ? '팀장' : '팀원'
      return <article className="managed-row ui-card" key={survey.id} data-motion-reveal style={{ '--delay': `${Math.min(index, 4) * 50}ms` }}>
        <div className="managed-row__title"><span className={`service-tone--${['violet', 'amber', 'rose', 'mint', 'blue'][index % 5]}`}>{['◇', '○', '▤', '◎', '✦'][index % 5]}</span><div><div className="managed-title-line"><h2>{survey.title}</h2><em className={`survey-state survey-state--${stateKey}`}>{stateLabel}</em>{isTargetReached(survey) && <em className="survey-state survey-state--success">목표 달성</em>}</div><p>{survey.description}</p><small>{isApiConfigured ? `${isTeamSurvey ? `팀 · ${survey.owner_name} (${teamLabel})` : '개인'} · ${survey.question_count}문항` : `${survey.category || '일반'} · 약 ${survey.estimated_minutes || 5}분`}{survey.deadline ? ` · 마감 ${survey.deadline}` : ''}</small></div></div>
        <div className="managed-progress"><span>{Number(survey.response_count || 0).toLocaleString()} / {Number(survey.target_count || 0).toLocaleString()}명 <b>{progress}%</b></span><div><i style={{ '--progress': `${progress}%` }} /></div><small>{progress >= 100 ? '목표를 달성했어요! 🎉' : `목표까지 ${Math.max(0, Number(survey.target_count || 0) - Number(survey.response_count || 0))}명 남았어요.`}</small></div>
        <div className="managed-actions">{isApiConfigured && stateKey === 'draft' ? <Link className="managed-primary" to={`/formmate?draft=${survey.id}`}>이어서 편집</Link> : canManage ? <Link className="managed-primary" to={`/my-surveys/${survey.id}/manage`}>관리하기</Link> : <Link className="managed-primary" to={`/surveys/${survey.id}/results`}>결과 보기</Link>}<div className="row-menu" ref={menuId === survey.id ? menuRef : null}><button type="button" aria-label="설문 메뉴" aria-expanded={menuId === survey.id} onClick={() => setMenuId(menuId === survey.id ? '' : survey.id)}>•••</button>{menuId === survey.id && <div className="row-menu__popover"><button type="button" onClick={() => share(survey)}>링크 복사</button><button type="button" onClick={() => duplicate(survey)}>복제하기</button>{stateKey === 'active' && canManage && <button type="button" onClick={() => setCloseConfirmSurvey(survey)}>직접 마감</button>}{canDeleteSurvey(survey) && <button className="is-danger" type="button" onClick={() => { setConfirmSurvey(survey); setMenuId('') }}>삭제하기</button>}</div>}</div></div>
      </article>
    })}{!display.length && <section className="result-empty"><span>▤</span><h2>조건에 맞는 설문이 없어요.</h2><p>검색 조건을 초기화하거나 FormMate로 새 설문을 만들어보세요.</p><button className="ui-button ui-button--secondary" type="button" onClick={() => { setQuery(''); setStatus('all'); setSort('latest') }}>필터 초기화</button></section>}</section>}
    <Modal open={Boolean(confirmSurvey)} title="설문을 삭제할까요?" onClose={closeModals}><p>‘{confirmSurvey?.title}’ 설문은 삭제 후 복구할 수 없습니다.</p>{modalError && <p className="form-message form-message--error" role="alert">{modalError}</p>}<div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeModals}>취소</button><button className="ui-button ui-button--danger" disabled={busy} onClick={remove}>{busy ? '삭제 중…' : '삭제'}</button></div></Modal>
    <Modal open={Boolean(closeConfirmSurvey)} title="설문을 직접 마감할까요?" onClose={closeModals}><p>마감한 설문은 다시 열 수 없습니다. 같은 주제로 다시 모집하려면 설문을 복제해 새로 게시해야 하며, 마감 30일 후 설문 원문은 파기됩니다.</p>{modalError && <p className="form-message form-message--error" role="alert">{modalError}</p>}<div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeModals}>취소</button><button className="ui-button ui-button--danger" disabled={busy} onClick={confirmClose}>{busy ? '마감 중…' : '마감하기'}</button></div></Modal>
    {toast && <div className="service-toast" role="status">✓ {toast}</div>}
  </div></ServiceShell>
}
