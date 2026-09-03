import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import { useAuth } from '../hooks/useAuth'
import { usePoints } from '../hooks/usePoints'
import { getPointTransactions } from '../services/pointService'
import { getMySurveys } from '../services/surveyService'
import { formatPoints } from '../utils/pointCalculator'

const transactionLabels = { survey_reward: '설문 참여 리워드', survey_funding: '설문 모집 예산' }

export default function Dashboard() {
  const { user } = useAuth()
  const { points } = usePoints()
  const [transactions, setTransactions] = useState([])
  const [surveys, setSurveys] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([getPointTransactions(), getMySurveys(user.id)])
      .then(([ledger, mine]) => { setTransactions(ledger); setSurveys(mine) })
      .catch((error) => setMessage(error.message))
  }, [user.id])

  const totalResponses = surveys.reduce((sum, survey) => sum + (survey.response_count || 0), 0)
  const analyzable = surveys.filter((survey) => survey.response_count > 0).length

  return <><Header /><main className="app-main"><div className="page-heading page-heading--row"><div><p className="eyebrow">MY SURVEYS</p><h1>내 설문과 결과</h1><p>내가 만든 설문의 모집 현황과 분석 가능한 결과를 확인하세요.</p></div><Link className="button" to="/surveys/create">+ 새 설문 만들기</Link></div>
    <section className="stats-grid"><article><span>보유 포인트</span><strong>{formatPoints(points)}</strong><small>사용 가능한 잔액</small></article><article><span>받은 응답</span><strong>{totalResponses}</strong><small>내 설문 누적 응답</small></article><article><span>분석 가능</span><strong>{analyzable}</strong><small>응답이 있는 내 설문</small></article></section>
    {message && <div className="empty-state">{message}</div>}
    <section className="dashboard-grid"><article className="panel"><div className="section-title"><div><p className="eyebrow">CREATED BY ME</p><h2>진행 중인 설문</h2></div><Link to="/surveys">설문 목록 →</Link></div><div className="my-survey-list">{surveys.map((survey) => <div className="dashboard-survey" key={survey.id}><div className="dashboard-survey__title"><span className="tag">{survey.category}</span>{survey.response_count > 0 && <span className="result-ready">분석 가능</span>}</div><h3>{survey.title}</h3><ProgressBar value={survey.response_count || 0} max={survey.target_count} /><div className="dashboard-survey__meta"><span>응답 {survey.response_count || 0} / {survey.target_count}</span>{survey.response_count > 0 ? <Link to={`/surveys/${survey.id}/results`}>결과 분석 보기 →</Link> : <span>첫 응답을 기다리고 있어요</span>}</div></div>)}</div>{!surveys.length && <div className="empty-state"><p>아직 만든 설문이 없어요.</p><Link to="/surveys/create">첫 설문 만들기 →</Link></div>}</article>
      <article className="panel"><div className="section-title"><div><p className="eyebrow">POINT LEDGER</p><h2>최근 포인트 내역</h2></div></div><ul className="transaction-list">{transactions.map((transaction) => <li key={transaction.id}><span className={transaction.amount > 0 ? 'transaction-icon transaction-icon--plus' : 'transaction-icon'}>{transaction.amount > 0 ? '+' : '−'}</span><div><strong>{transactionLabels[transaction.type] || transaction.type}</strong><small>{new Date(transaction.created_at).toLocaleDateString('ko-KR')}</small></div><b className={transaction.amount > 0 ? 'amount-plus' : ''}>{transaction.amount > 0 ? '+' : ''}{formatPoints(transaction.amount)}</b></li>)}</ul>{!transactions.length && <div className="empty-state">포인트 내역이 아직 없어요.</div>}</article></section>
  </main></>
}
