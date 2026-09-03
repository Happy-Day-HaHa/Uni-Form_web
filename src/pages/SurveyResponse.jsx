import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import QuestionItem from '../components/QuestionItem'
import { submitSurveyResponse } from '../services/responseService'
import { getSurvey } from '../services/surveyService'
import { useAuth } from '../hooks/useAuth'

export default function SurveyResponse() {
  const { surveyId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(null)
  const [answers, setAnswers] = useState({})
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { getSurvey(surveyId).then(setSurvey).catch((error) => setMessage(error.message)) }, [surveyId])
  if (!survey) return <><Header /><main className="app-main"><div className="empty-state">{message || '설문을 불러오고 있어요.'}</div></main></>
  const isOwner = survey.creator_id === user.id
  if (isOwner) return <><Header /><main className="app-main app-main--narrow"><div className="empty-state result-gate"><b>MY SURVEY</b><h1>{survey.title}</h1><p>본인이 만든 설문에는 직접 응답할 수 없어요.</p>{survey.response_count > 0 ? <Link className="button" to={`/surveys/${survey.id}/results`}>결과 분석 보기 →</Link> : <Link className="button" to="/dashboard">응답 현황 확인하기 →</Link>}</div></main></>
  async function handleSubmit(event) {
    event.preventDefault()
    if (survey.questions?.some((question) => answers[question.id] === undefined || answers[question.id] === '')) return setMessage('모든 질문에 답해주세요.')
    try { setSubmitting(true); await submitSurveyResponse(survey.id, answers); setSubmitted(true) } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }
  return <><Header /><main className="app-main app-main--narrow"><Link className="back-link" to="/surveys">← 설문 목록</Link><section className="survey-intro"><div><span className="tag">{survey.category}</span><h1>{survey.title}</h1><p>{survey.description}</p></div></section><ProgressBar value={survey.response_count || 0} max={survey.target_count} /><form className="question-list" onSubmit={handleSubmit}>{survey.questions?.map((question, index) => <QuestionItem key={question.id} question={question} index={index} value={answers[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />)}{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '제출 중...' : '응답 제출하기'}</button></form></main><Modal open={submitted} title="응답이 제출되었어요!" onClose={() => navigate('/surveys')}><div className="success-mark">✓</div><p>소중한 의견 감사합니다. 설문 목록에서 다른 설문에도 참여할 수 있어요.</p><button className="button button--block" onClick={() => navigate('/surveys')}>설문 목록으로</button></Modal></>
}
