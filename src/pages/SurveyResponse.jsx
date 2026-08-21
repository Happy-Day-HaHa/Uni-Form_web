import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import QuestionItem from '../components/QuestionItem'
import { submitSurveyResponse } from '../services/responseService'
import { getSurvey } from '../services/surveyService'
import { formatPoints } from '../utils/pointCalculator'

export default function SurveyResponse() {
  const { surveyId } = useParams()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(null)
  const [answers, setAnswers] = useState({})
  const [message, setMessage] = useState('')
  const [reward, setReward] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { getSurvey(surveyId).then(setSurvey).catch((error) => setMessage(error.message)) }, [surveyId])
  if (!survey) return <><Header /><main className="app-main"><div className="empty-state">{message || '설문을 불러오고 있어요.'}</div></main></>
  async function handleSubmit(event) {
    event.preventDefault()
    if (survey.questions?.some((question) => answers[question.id] === undefined || answers[question.id] === '')) return setMessage('모든 질문에 답해주세요.')
    try { setSubmitting(true); const result = await submitSurveyResponse(survey.id, answers); setReward(result.reward_points ?? survey.reward_points) } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }
  return <><Header /><main className="app-main app-main--narrow"><Link className="back-link" to="/surveys">← 설문 목록</Link><section className="survey-intro"><div><span className="tag">{survey.category}</span><h1>{survey.title}</h1><p>{survey.description}</p></div><div className="reward-box"><small>완료 리워드</small><strong>{formatPoints(survey.reward_points)}</strong></div></section><ProgressBar value={survey.response_count || 0} max={survey.target_count} /><form className="question-list" onSubmit={handleSubmit}>{survey.questions?.map((question, index) => <QuestionItem key={question.id} question={question} index={index} value={answers[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />)}{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '제출 중...' : '응답 제출하기'}</button></form></main><Modal open={reward !== null} title="응답이 제출되었어요!" onClose={() => navigate('/surveys')}><div className="success-mark">✓</div><p>소중한 의견 감사합니다. 포인트가 즉시 적립되었습니다.</p><strong className="modal-reward">+ {formatPoints(reward)}</strong><button className="button button--block" onClick={() => navigate('/dashboard')}>대시보드에서 확인</button></Modal></>
}
