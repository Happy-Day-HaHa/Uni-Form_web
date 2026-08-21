import { useEffect, useState } from 'react'
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
  useEffect(() => { Promise.all([getSurveys(), getProfile(user.id)]).then(([items, profile]) => setSurveys(items.filter((survey) => matchesProfile(survey, profile)))).catch((reason) => setError(reason.message)).finally(() => setLoading(false)) }, [user])
  return <><Header /><main className="app-main"><div className="page-heading page-heading--row"><div><p className="eyebrow">MATCHED FOR YOU</p><h1>지금 참여할 수 있는 설문</h1><p>프로필 조건에 맞는 설문만 모았습니다.</p></div>{demoMode && <span className="demo-pill">DEMO DATA</span>}</div>{loading && <div className="empty-state">설문을 불러오고 있어요.</div>}{error && <div className="empty-state">{error}</div>}<section className="survey-grid" aria-live="polite">{surveys.map((survey) => <SurveyCard key={survey.id} survey={survey} />)}</section>{!loading && !surveys.length && <div className="empty-state">현재 조건에 맞는 설문이 없습니다.</div>}</main></>
}
