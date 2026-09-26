import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ServiceShell from '../components/ServiceShell'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import { closeSurvey as closeSurveyRequest, getSurvey, isDemoSurveyFixture } from '../services/surveyService'
import { getSurveyLifecycleStatus, isTargetReached } from '../utils/surveyPolicy'

function statusLabel(status) {
  if (status === 'draft') return '임시저장'
  if (status === 'closed') return '마감'
  if (status === 'archived') return '보관'
  return '모집 중'
}

export default function SurveyManage() {
  const { surveyId } = useParams()
  const { user, demoMode } = useAuth()
  const [survey, setSurvey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [closeOpen, setCloseOpen] = useState(false)

  useEffect(() => {
    getSurvey(surveyId).then((item) => {
      if (!item) throw new Error('설문을 찾을 수 없습니다.')
      const canManage = (item.is_owner ?? item.creator_id === user.id) || (demoMode && isDemoSurveyFixture(item.id))
      if (!canManage) throw new Error('이 설문을 관리할 권한이 없습니다.')
      setSurvey(item)
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false))
  }, [demoMode, surveyId, user.id])

  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 1800); return () => window.clearTimeout(timer) }, [toast])

  async function share() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/surveys/${survey.id}`); setToast('설문 링크를 복사했습니다.') } catch { setToast('주소창의 링크를 복사해주세요.') }
  }

  async function closeSurvey() {
    const updated = await closeSurveyRequest(survey.id)
    setSurvey((current) => ({ ...current, ...updated, status: 'closed' }))
    setCloseOpen(false)
    setToast('설문 모집을 종료했습니다.')
  }

  if (loading) return <ServiceShell activePath="/my-surveys"><div className="survey-manage-loading">설문 관리 정보를 불러오고 있어요.</div></ServiceShell>
  if (error) return <ServiceShell activePath="/my-surveys"><section className="result-state"><span>!</span><h1>{error}</h1><p>내 설문에서 다시 확인해주세요.</p><div><Link className="ui-button" to="/my-surveys">내 설문으로 돌아가기</Link></div></section></ServiceShell>

  const responses = Number(survey.response_count || 0)
  const target = Math.max(1, Number(survey.target_count || 1))
  const progress = Math.min(100, Math.round(responses / target * 100))
  const isDraft = survey.status === 'draft'
  const lifecycleStatus = getSurveyLifecycleStatus(survey)
  const isClosed = lifecycleStatus === 'closed'

  return <ServiceShell activePath="/my-surveys"><div className="survey-manage">
    <nav className="survey-manage__breadcrumb" aria-label="현재 위치"><Link to="/my-surveys">내 설문</Link><span>/</span><strong>{survey.title}</strong><span>/</span><b>관리</b></nav>
    <header className="survey-manage__header"><div><span className={`survey-state survey-state--${lifecycleStatus}`}>{statusLabel(lifecycleStatus)}</span>{isTargetReached(survey) && <span className="survey-state survey-state--success">목표 달성</span>}<h1>{survey.title}</h1><p>{survey.description}</p></div></header>

    <section className="survey-manage__overview">
      <article><small>현재 상태</small><strong>{statusLabel(lifecycleStatus)}</strong></article>
      <article><small>응답</small><strong>{responses.toLocaleString()} / {target.toLocaleString()}명</strong><div><i style={{ '--progress': `${progress}%` }} /></div></article>
      <article><small>마감일</small><strong>{survey.deadline}</strong></article>
      <article><small>문항</small><strong>{survey.questions?.length || 0}개</strong></article>
    </section>

    <section className="survey-manage__actions"><header><h2>설문 관리</h2><p>이 설문에 필요한 작업만 모아두었습니다.</p></header><div>
      {!isDraft && <Link className="survey-manage-action survey-manage-action--primary" to={`/surveys/${survey.id}/results`}><span>결과 확인</span><small>모인 응답과 문항별 결과를 확인합니다.</small><b>→</b></Link>}
      <button className="survey-manage-action" type="button" onClick={share}><span>설문 링크 복사</span><small>참여자에게 공유할 주소를 복사합니다.</small><b>→</b></button>
      {!isDraft && !isClosed && <button className="survey-manage-action" type="button" onClick={() => setCloseOpen(true)}><span>직접 마감</span><small>새 응답 모집을 종료합니다.</small><b>→</b></button>}
    </div></section>
    <Modal open={closeOpen} title="설문을 직접 마감할까요?" onClose={() => setCloseOpen(false)}><p>마감한 설문은 다시 열 수 없습니다. 같은 주제로 다시 모집하려면 재업로드해야 하며, 마감 30일 후 설문 원문은 파기됩니다.</p><div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setCloseOpen(false)}>취소</button><button className="ui-button ui-button--danger" onClick={closeSurvey}>마감하기</button></div></Modal>
    {toast && <div className="service-toast" role="status">✓ {toast}</div>}
  </div></ServiceShell>
}
