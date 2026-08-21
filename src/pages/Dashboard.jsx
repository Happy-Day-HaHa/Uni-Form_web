import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import ProgressBar from '../components/ProgressBar'
import { usePoints } from '../hooks/usePoints'
import { getPointTransactions } from '../services/pointService'
import { demoSurveys } from '../services/surveyService'
import { formatPoints } from '../utils/pointCalculator'

const transactionLabels = { survey_reward: '설문 참여 리워드', survey_funding: '설문 모집 예산' }
export default function Dashboard() {
  const { points } = usePoints()
  const [transactions, setTransactions] = useState([])
  useEffect(() => { getPointTransactions().then(setTransactions).catch(() => setTransactions([])) }, [])
  const mySurvey = demoSurveys[0]
  return <><Header /><main className="app-main"><div className="page-heading page-heading--row"><div><p className="eyebrow">DASHBOARD</p><h1>의견과 포인트의 흐름</h1><p>응답 모집 현황과 포인트 이동을 한눈에 확인하세요.</p></div><Link className="button" to="/surveys/create">새 설문 만들기</Link></div><section className="stats-grid"><article><span>보유 포인트</span><strong>{formatPoints(points)}</strong><small>사용 가능한 잔액</small></article><article><span>받은 응답</span><strong>82</strong><small>이번 달 +24</small></article><article><span>참여한 설문</span><strong>12</strong><small>누적 참여 수</small></article></section><section className="dashboard-grid"><article className="panel"><div className="section-title"><div><p className="eyebrow">MY SURVEY</p><h2>진행 중인 설문</h2></div><Link to="/surveys">전체 보기 →</Link></div><div className="dashboard-survey"><span className="tag">{mySurvey.category}</span><h3>{mySurvey.title}</h3><ProgressBar value={mySurvey.response_count} max={mySurvey.target_count} /><div className="dashboard-survey__meta"><span>지급 포인트 {formatPoints(mySurvey.response_count * mySurvey.reward_points)}</span><span>남은 응답 {mySurvey.target_count - mySurvey.response_count}명</span></div></div></article><article className="panel"><div className="section-title"><div><p className="eyebrow">POINT LEDGER</p><h2>최근 포인트 내역</h2></div></div><ul className="transaction-list">{transactions.map((transaction) => <li key={transaction.id}><span className={transaction.amount > 0 ? 'transaction-icon transaction-icon--plus' : 'transaction-icon'}>{transaction.amount > 0 ? '+' : '−'}</span><div><strong>{transactionLabels[transaction.type] || transaction.type}</strong><small>{new Date(transaction.created_at).toLocaleDateString('ko-KR')}</small></div><b className={transaction.amount > 0 ? 'amount-plus' : ''}>{transaction.amount > 0 ? '+' : ''}{formatPoints(transaction.amount)}</b></li>)}</ul></article></section></main></>
}
