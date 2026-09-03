import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import SurveyCard from '../components/SurveyCard'
import { useAuth } from '../hooks/useAuth'
import { getSurveys } from '../services/surveyService'
import { getProfile } from '../services/userService'
import { matchesProfile } from '../utils/surveyFilter'

export default function SurveyList() {
  const { user, demoMode } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([getSurveys(), user ? getProfile(user.id) : Promise.resolve(null)]).then(([items, profile]) => setSurveys(profile ? items.filter((survey) => matchesProfile(survey, profile)) : items)).catch((reason) => setError(reason.message)).finally(() => setLoading(false)) }, [user])
  return <><Header /><main className="app-main"><div className="page-heading page-heading--row"><div><p className="eyebrow">{user ? 'MATCHED FOR YOU' : 'OPEN SURVEYS'}</p><h1>지금 참여할 수 있는 설문</h1><p>{user ? '프로필 조건에 맞는 설문을 확인하고 바로 참여하세요.' : '로그인 전에도 진행 중인 설문을 둘러볼 수 있어요.'}</p></div><div className="page-heading__actions">{demoMode && <span className="demo-pill">DEMO DATA</span>}<Link className="button" to="/surveys/create">+ 만들기</Link></div></div>{loading && <div className="empty-state">설문을 불러오고 있어요.</div>}{error && <div className="empty-state">{error}</div>}<section className="survey-grid" aria-live="polite">{surveys.map((survey) => <SurveyCard key={survey.id} survey={survey} userId={user?.id} />)}</section>{!loading && !surveys.length && <div className="empty-state">현재 조건에 맞는 설문이 없습니다.</div>}</main></>
}
