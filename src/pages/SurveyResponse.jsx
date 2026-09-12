import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import QuestionItem from '../components/QuestionItem'
import ServiceShell from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { submitSurveyResponse } from '../services/responseService'
import { getSurvey } from '../services/surveyService'

export default function SurveyResponse() {
  const { surveyId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(null)
  const [answers, setAnswers] = useState({})
  const [message, setMessage] = useState('')
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { getSurvey(surveyId).then(setSurvey).catch((error) => setMessage(error.message)) }, [surveyId])
  if (!survey) return <ServiceShell activePath="/surveys"><div className="empty-state">{message || '설문을 불러오고 있어요.'}</div></ServiceShell>
  const isOwner = survey.creator_id === user.id
  if (isOwner) return <ServiceShell activePath="/my-surveys"><div className="empty-state result-gate"><b>MY SURVEY</b><h1>{survey.title}</h1><p>본인이 만든 설문에는 직접 응답할 수 없어요.</p>{survey.response_count > 0 ? <Link className="ui-button" to={`/surveys/${survey.id}/results`}>결과 분석 보기 →</Link> : <Link className="ui-button" to="/dashboard">응답 현황 확인하기 →</Link>}</div></ServiceShell>

  async function handleSubmit(event) {
    event.preventDefault()
    if (survey.questions?.some((question) => answers[question.id] === undefined || answers[question.id] === '')) return setMessage('모든 질문에 답해주세요.')
    try { setSubmitting(true); await submitSurveyResponse(survey.id, answers); setSubmitted(true) } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  const questions = survey.questions || []
  const answered = questions.filter((question) => answers[question.id] !== undefined && answers[question.id] !== '').length
  const remaining = Math.max(0, Number(survey.target_count || 0) - Number(survey.response_count || 0))

  return <ServiceShell activePath="/surveys"><div className={`survey-flow ${started ? 'survey-flow--answering' : ''}`}>
    <Link className="survey-flow__back" to="/surveys">← 설문 목록으로 돌아가기</Link>
    <header className="survey-flow__hero"><span className="survey-flow__icon">A</span><div><div className="survey-flow__title"><h1>{survey.title}</h1><em>{survey.category}</em></div><p>{survey.description}</p><ul><li>◷ 예상 소요 시간 약 {survey.estimated_minutes || 5}분</li><li>▤ 총 {questions.length}개 문항</li><li>◎ {survey.category}</li></ul></div>{!started && <button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>공유하기</button>}</header>
    {!started ? <>
      <section className="survey-detail-metrics"><article><span>◷</span><div><small>예상 소요 시간</small><strong>약 {survey.estimated_minutes || 5}분</strong></div></article><article><span>◎</span><div><small>설문 대상</small><strong>누구나 참여 가능</strong></div></article><article><span>♧</span><div><small>잔여 모집 인원</small><strong>{remaining.toLocaleString()}명</strong></div></article><article><span>▦</span><div><small>총 참여자 수</small><strong>{Number(survey.response_count || 0).toLocaleString()}명</strong></div></article></section>
      <section className="survey-detail-grid"><article className="survey-detail-card"><header><span>▤</span><h2>설문 안내</h2></header><p>이 설문은 다양한 경험과 의견을 이해하기 위해 진행됩니다. 응답 내용은 결과 분석 목적으로만 사용됩니다.</p><dl><div><dt>설문 주제</dt><dd>{survey.title}</dd></div><div><dt>설문 대상</dt><dd>참여 가능한 사용자</dd></div><div><dt>예상 소요 시간</dt><dd>약 {survey.estimated_minutes || 5}분</dd></div></dl></article><article className="survey-detail-card"><header><span>!</span><h2>참여 전 확인사항</h2></header><ul><li>한 번만 참여할 수 있는 설문입니다.</li><li>모든 문항에 성실하게 응답해 주세요.</li><li>응답 내용은 결과 분석에 활용됩니다.</li><li>제출 전까지 답변을 수정할 수 있습니다.</li></ul></article></section>
      <section className="survey-preview-card"><header><div><span>⌕</span><div><h2>주요 질문 미리보기</h2><p>실제 설문에 포함된 문항을 미리 확인해보세요.</p></div></div></header>{questions.slice(0, 3).map((question, index) => <div className="survey-preview-question" key={question.id}><span>{index + 1}</span><div><b>{question.title}</b><small>{question.type === 'text' ? '자유롭게 작성하는 질문입니다.' : '가장 가까운 항목을 선택하는 질문입니다.'}</small></div></div>)}</section>
      <section className="survey-start-card"><span>◇</span><h2>여러분의 의견이<br />더 나은 선택을 만듭니다.</h2><p>잠시 시간을 내어 소중한 의견을 들려주세요.</p><button className="ui-button" type="button" onClick={() => { setStarted(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>설문 시작하기 <b>→</b></button></section>
    </> : <>
      <section className="survey-answer-progress"><div><b>{answered} / {questions.length} 문항 완료</b><strong>{questions.length ? Math.round((answered / questions.length) * 100) : 0}%</strong></div><ProgressBar value={answered} max={Math.max(questions.length, 1)} /><p>모든 문항을 답변하면 제출할 수 있습니다.</p></section>
      <form className="survey-answer-list" onSubmit={handleSubmit}>{questions.map((question, index) => <QuestionItem key={question.id} question={question} index={index} value={answers[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />)}{message && <p className="form-message form-message--error">{message}</p>}<div className="survey-answer-actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setStarted(false)}>이전</button><button className="ui-button" disabled={submitting}>{submitting ? '제출 중...' : '응답 제출하기'} <span>→</span></button></div></form>
    </>}
  </div><Modal open={submitted} title="응답이 제출되었어요!" onClose={() => navigate('/surveys')}><div className="success-mark">✓</div><p>소중한 의견 감사합니다. 설문 목록에서 다른 설문에도 참여할 수 있어요.</p><button className="button button--block" onClick={() => navigate('/surveys')}>설문 목록으로</button></Modal></ServiceShell>
}
