import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import { useAuth } from '../hooks/useAuth'
import { getMySurveys } from '../services/surveyService'

export default function Dashboard() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    getMySurveys(user.id).then(setSurveys).catch((error) => setMessage(error.message))
  }, [user.id])

  const totalResponses = surveys.reduce((sum, survey) => sum + (survey.response_count || 0), 0)
  const analyzable = surveys.filter((survey) => survey.response_count > 0).length

  return <><Header /><main className="app-main"><div className="page-heading"><p className="eyebrow">MY SURVEYS</p><h1>내 설문과 결과</h1><p>내가 만든 설문의 모집 현황과 분석 가능한 결과를 확인하세요.</p></div>
    <section className="stats-grid"><article><span>만든 설문</span><strong>{surveys.length}</strong><small>현재까지 개설한 설문</small></article><article><span>받은 응답</span><strong>{totalResponses}</strong><small>내 설문 누적 응답</small></article><article><span>분석 가능</span><strong>{analyzable}</strong><small>응답이 있는 내 설문</small></article></section>
    {message && <div className="empty-state">{message}</div>}
    <section className="dashboard-grid dashboard-grid--single"><article className="panel"><div className="section-title"><div><p className="eyebrow">CREATED BY ME</p><h2>진행 중인 설문</h2></div><Link to="/surveys">설문 목록 →</Link></div><div className="my-survey-list">{surveys.map((survey) => <div className="dashboard-survey" key={survey.id}><div className="dashboard-survey__title"><span className="tag">{survey.category}</span>{survey.response_count > 0 && <span className="result-ready">분석 가능</span>}</div><h3>{survey.title}</h3><ProgressBar value={survey.response_count || 0} max={survey.target_count} /><div className="dashboard-survey__meta"><span>응답 {survey.response_count || 0} / {survey.target_count}</span>{survey.response_count > 0 ? <Link to={`/surveys/${survey.id}/results`}>결과 분석 보기 →</Link> : <span>첫 응답을 기다리고 있어요</span>}</div></div>)}</div>{!surveys.length && <div className="empty-state"><p>아직 만든 설문이 없어요.</p><Link to="/surveys/create">첫 설문 만들기 →</Link></div>}</article></section>
  </main></>
}
