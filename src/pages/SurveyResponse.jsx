import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import QuestionItem from '../components/QuestionItem'
import ServiceShell from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { etcAnswerKey, getRespondedSurveyIds, saveResponseAnswers, startResponseSession, submitSurveyResponse } from '../services/responseService'
import { isApiConfigured } from '../services/apiClient'
import { getSurvey } from '../services/surveyService'
import { SUPPORT_EMAIL } from '../constants'
import { isSurveyOpen } from '../utils/surveyPolicy'
import { getLeaderboard } from '../services/leaderboardService'

function isAnswered(question, answers) {
  const value = answers[question.id]
  if (Array.isArray(value)) return value.length > 0
  return value !== undefined && value !== ''
}

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
  const [invalidQuestionIds, setInvalidQuestionIds] = useState([])
  const [sameAnswerWarning, setSameAnswerWarning] = useState(false)
  const [confirmedSameAnswer, setConfirmedSameAnswer] = useState(false)
  const [alreadyResponded, setAlreadyResponded] = useState(false)
  const [weeklyActivity, setWeeklyActivity] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [starting, setStarting] = useState(false)
  // 서버가 응답을 막은 이유: already(중복 응답) · closed(마감/모집 중 아님) · own(본인·팀 설문)
  const [blocked, setBlocked] = useState({ reason: '', message: '' })
  const [saveNote, setSaveNote] = useState('')
  // 응답 여부 조회가 실패해도 설문은 보여준다. 중복 응답은 세션 시작 때 서버가 다시 막는다.
  useEffect(() => { Promise.all([getSurvey(surveyId), getRespondedSurveyIds(user?.id).catch(() => [])]).then(([item, ids]) => { if (!item) throw new Error('설문을 찾을 수 없습니다.'); setSurvey(item); setAlreadyResponded(ids.includes(surveyId)) }).catch((error) => setMessage(error.message)) }, [surveyId, user?.id])

  // 임시저장은 한 번에 하나씩 보낸다. 전송 중에 답이 또 바뀌면 끝난 뒤 가장 최신 답으로 한 번 더 저장해서,
  // 늦게 도착한 옛 저장이 새 답을 덮어쓰지 않게 한다. 제출을 시작하면 남은 저장은 버린다.
  const saveQueueRef = useRef({ running: false, pending: null, stopped: false })
  function queueSave(snapshot) {
    const queue = saveQueueRef.current
    queue.pending = snapshot
    if (queue.running) return
    queue.running = true
    ;(async () => {
      while (queue.pending && !queue.stopped) {
        const next = queue.pending
        queue.pending = null
        setSaveNote('임시저장 중…')
        try {
          await saveResponseAnswers(survey, sessionId, next)
          if (!queue.stopped) setSaveNote(queue.pending ? '임시저장 중…' : '임시저장됨')
        } catch (error) {
          if (!queue.stopped && !applyBlockingError(error)) setSaveNote(`임시저장 실패: ${error.message}`)
        }
      }
      queue.running = false
    })()
  }

  // 답을 바꾸면 1초 뒤 서버에 임시저장한다(API 모드). 실패해도 제출은 막지 않는다.
  useEffect(() => {
    if (!started || !sessionId || submitted) return undefined
    const timer = window.setTimeout(() => queueSave(answers), 1000)
    return () => window.clearTimeout(timer)
  }, [answers, sessionId, started, submitted])

  // 응답 자체가 불가능한 에러면 안내 화면으로 전환하고 true를 돌려준다.
  function applyBlockingError(error) {
    const reasonMap = { ALREADY_RESPONDED: 'already', SURVEY_NOT_RECRUITING: 'closed', OWNER_CANNOT_RESPOND: 'own' }
    const reason = reasonMap[error?.reason]
    if (!reason) return false
    setBlocked({ reason, message: error.message })
    return true
  }

  if (blocked.reason) return <ServiceShell activePath="/surveys"><div className="empty-state result-gate"><b>{blocked.reason === 'already' ? 'COMPLETED' : blocked.reason === 'closed' ? 'CLOSED' : 'MY SURVEY'}</b><h1>{survey.title}</h1><p>{blocked.message}</p><Link className="ui-button" to="/surveys">다른 설문 보기</Link></div></ServiceShell>
  if (!survey) return <ServiceShell activePath="/surveys"><div className="empty-state">{message || '설문을 불러오고 있어요.'}</div></ServiceShell>
  const isOwner = survey.is_owner ?? survey.creator_id === user.id
  if (isOwner) return <ServiceShell activePath="/my-surveys"><div className="empty-state result-gate"><b>MY SURVEY</b><h1>{survey.title}</h1><p>본인이 만든 설문에는 직접 응답할 수 없어요.</p>{survey.response_count > 0 || survey.is_owner ? <Link className="ui-button" to={`/surveys/${survey.id}/results`}>문항별 결과 보기 →</Link> : <Link className="ui-button" to="/dashboard">응답 현황 확인하기 →</Link>}</div></ServiceShell>
  if (alreadyResponded) return <ServiceShell activePath="/surveys"><div className="empty-state result-gate"><b>COMPLETED</b><h1>{survey.title}</h1><p>이미 응답을 완료한 설문입니다.</p><Link className="ui-button" to="/surveys">다른 설문 보기</Link></div></ServiceShell>
  if (!isSurveyOpen(survey)) return <ServiceShell activePath="/surveys"><div className="empty-state result-gate"><b>CLOSED</b><h1>{survey.title}</h1><p>마감된 설문입니다.</p><Link className="ui-button" to="/surveys">설문 목록으로</Link></div></ServiceShell>

  async function startSurvey() {
    setMessage('')
    if (isApiConfigured) {
      try {
        setStarting(true)
        const session = await startResponseSession(survey)
        setSessionId(session.sessionId)
        // 이전에 임시저장한 답이 있으면 이어서 보여준다.
        setAnswers((current) => Object.keys(current).length ? current : session.answers)
      } catch (error) {
        if (!applyBlockingError(error)) setMessage(error.message)
        return
      } finally {
        setStarting(false)
      }
    }
    setStarted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitNow({ sameScaleWarningAcknowledged = confirmedSameAnswer } = {}) {
    try {
      setSubmitting(true)
      setMessage('')
      // 제출 중·후에 끝난 임시저장이 "이미 응답" 에러로 화면을 바꾸지 않도록 저장 대기열을 멈춘다.
      saveQueueRef.current.stopped = true
      saveQueueRef.current.pending = null
      const result = await submitSurveyResponse(survey.id, answers, { survey, sessionId, sameScaleWarningAcknowledged })
      // 순위는 리더보드 화면과 같은 GET /leaderboard의 내 순위를 쓴다. 실패하면 제출 응답의 weeklyRank로 대신한다.
      const leaderboardMe = await getLeaderboard(user.id).then((data) => data.me).catch(() => null)
      setWeeklyActivity(leaderboardMe || (isApiConfigured ? { rank: result.weeklyRank, earned: result.pointsEarned } : null))
      setSubmitted(true)
    } catch (error) {
      // 제출이 실패하면 임시저장을 다시 허용한다.
      saveQueueRef.current.stopped = false
      if (!applyBlockingError(error)) setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const requiredQuestions = (survey.questions || []).filter((question) => question.required === true)
    const missingQuestionIds = requiredQuestions.filter((question) => !isAnswered(question, answers)).map((question) => question.id)
    if (missingQuestionIds.length) {
      setInvalidQuestionIds(missingQuestionIds)
      setMessage('모든 필수 질문에 답해주세요.')
      window.requestAnimationFrame(() => document.getElementById(`question-${missingQuestionIds[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    setInvalidQuestionIds([])
    setMessage('')

    if (!confirmedSameAnswer) {
      const scaleQuestions = (survey.questions || []).filter((question) => question.type === 'scale' && isAnswered(question, answers))
      const uniqueValues = new Set(scaleQuestions.map((question) => answers[question.id]))
      if (scaleQuestions.length >= 3 && uniqueValues.size === 1) {
        setSameAnswerWarning(true)
        return
      }
    }
    await submitNow()
  }

  const questions = survey.questions || []
  const answered = questions.filter((question) => isAnswered(question, answers)).length

  return <ServiceShell activePath="/surveys"><div className={`survey-flow ${started ? 'survey-flow--answering' : ''}`}>
    <Link className="survey-flow__back" to="/surveys">← 설문 목록으로 돌아가기</Link>
    <header className="survey-flow__hero"><span className="survey-flow__icon">A</span><div><div className="survey-flow__title"><h1>{survey.title}</h1><em>{survey.category}</em></div><p>{survey.description}</p><ul><li>◷ 예상 소요 시간 약 {survey.estimated_minutes || 5}분</li><li>▤ 총 {questions.length}개 문항</li><li>◎ {survey.category}</li></ul>{!started && <a className="survey-flow__report-link" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[설문 신고] ${survey.title}`)}&body=${encodeURIComponent(`신고 사유를 적어주세요.\n\n신고 대상 설문: ${window.location.href}`)}`}>신고하기</a>}</div>{!started && <div className="survey-flow__hero-actions"><button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>공유하기</button></div>}</header>
    {!started ? <>
      <section className="survey-detail-metrics"><article><span>◷</span><div><small>예상 소요 시간</small><strong>약 {survey.estimated_minutes || 5}분</strong></div></article><article><span>◎</span><div><small>참여 대상</small><strong>모든 회원</strong></div></article><article><span>♧</span><div><small>목표 응답 인원</small><strong>{Number(survey.target_count || 0).toLocaleString()}명</strong></div></article><article><span>▦</span><div><small>현재 응답 수</small><strong>{Number(survey.response_count || 0).toLocaleString()}명</strong></div></article></section>
      <section className="survey-detail-grid"><article className="survey-detail-card"><header><span>▤</span><h2>설문 안내</h2></header><p>이 설문은 다양한 경험과 의견을 이해하기 위해 진행됩니다. 응답 내용은 결과 분석 목적으로만 사용됩니다.</p><dl><div><dt>설문 주제</dt><dd>{survey.title}</dd></div><div><dt>설문 대상</dt><dd>참여 가능한 사용자</dd></div><div><dt>예상 소요 시간</dt><dd>약 {survey.estimated_minutes || 5}분</dd></div></dl></article><article className="survey-detail-card"><header><span>!</span><h2>참여 전 확인사항</h2></header><ul><li>한 번만 참여할 수 있는 설문입니다.</li><li>모든 문항에 성실하게 응답해 주세요.</li><li>응답 내용은 결과 분석에 활용됩니다.</li><li>제출 전까지 답변을 수정할 수 있습니다.</li></ul></article></section>
      <section className="survey-preview-card"><header><div><span>⌕</span><div><h2>주요 질문 미리보기</h2><p>실제 설문에 포함된 문항을 미리 확인해보세요.</p></div></div></header>{questions.slice(0, 3).map((question, index) => <div className="survey-preview-question" key={question.id}><span>{index + 1}</span><div><b>{question.title}</b><small>{question.type === 'text' || question.type === 'long' ? '자유롭게 작성하는 질문입니다.' : question.type === 'multiple' ? '여러 항목을 선택하는 질문입니다.' : '가장 가까운 항목을 선택하는 질문입니다.'}</small></div></div>)}</section>
      <section className="survey-start-card"><span>◇</span><h2>여러분의 의견이<br />더 나은 선택을 만듭니다.</h2><p>잠시 시간을 내어 소중한 의견을 들려주세요.</p>{message && <p className="form-message form-message--error" role="alert">{message}</p>}<button className="ui-button" type="button" disabled={starting} onClick={startSurvey}>{starting ? '준비 중…' : '설문 시작하기'} <b>→</b></button></section>
    </> : <>
      <section className="survey-answer-progress"><div><b>{answered} / {questions.length} 문항 완료</b><strong>{questions.length ? Math.round((answered / questions.length) * 100) : 0}%</strong></div><ProgressBar value={answered} max={Math.max(questions.length, 1)} /><p><b aria-hidden="true">*</b> 표시는 필수 응답 문항입니다.{saveNote && <small> · {saveNote}</small>}</p></section>
      <form className="survey-answer-list" onSubmit={handleSubmit}>{questions.map((question, index) => <QuestionItem key={question.id} question={question} index={index} value={answers[question.id]} error={invalidQuestionIds.includes(question.id)} onChange={(value) => { setAnswers((current) => ({ ...current, [question.id]: value })); setInvalidQuestionIds((current) => current.filter((id) => id !== question.id)) }} etcValue={answers[etcAnswerKey(question.id)] || ''} onEtcChange={(value) => setAnswers((current) => ({ ...current, [etcAnswerKey(question.id)]: value }))} />)}{message && <p className="form-message form-message--error" role="alert">{message}</p>}<div className="survey-answer-actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setStarted(false)}>이전</button><button className="ui-button" disabled={submitting}>{submitting ? '제출 중...' : '응답 제출하기'} <span>→</span></button></div></form>
    </>}
  </div><Modal open={sameAnswerWarning} title="같은 점수만 선택했어요" onClose={() => setSameAnswerWarning(false)}><p>모든 척도 문항에 같은 점수를 선택했어요.<br />성실한 응답이 좋은 설문 결과를 만듭니다.<br />이대로 제출할까요?</p><div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setSameAnswerWarning(false)}>다시 확인하기</button><button className="ui-button" onClick={() => { setSameAnswerWarning(false); setConfirmedSameAnswer(true); submitNow({ sameScaleWarningAcknowledged: true }) }}>그대로 제출</button></div></Modal>
  <Modal open={submitted} title="응답 완료! +1회" onClose={() => navigate('/surveys')}><div className="success-mark">✓</div><p>소중한 의견 감사합니다. 이번 주 응답 횟수 리더보드에 반영됩니다.</p>{weeklyActivity && <p className="response-weekly-stats"><b>{weeklyActivity.rank ? `이번 주 ${weeklyActivity.rank}위` : '이번 주 순위 집계 중'}</b><span>{weeklyActivity.score != null ? `총 ${weeklyActivity.score}회 응답` : `+${weeklyActivity.earned ?? 1}회 반영`}</span></p>}<div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => navigate('/surveys')}>다른 설문 보기</button><button className="ui-button" onClick={() => navigate('/leaderboard')}>이번 주 순위 확인하기 →</button></div></Modal></ServiceShell>
}
