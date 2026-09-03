import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import { formatPoints } from '../utils/pointCalculator'

export default function SurveyCard({ survey, userId }) {
  const isOwner = survey.creator_id === userId
  const canViewResults = isOwner && survey.response_count > 0
  return <article className={`survey-card ${isOwner ? 'survey-card--owned' : ''}`}><div className="survey-card__top"><span className="tag">{isOwner ? '내 설문' : survey.category || '일반'}</span><strong>{isOwner ? `${survey.response_count || 0}명 응답` : formatPoints(survey.reward_points)}</strong></div><h2>{survey.title}</h2><p>{survey.description}</p><ProgressBar value={survey.response_count || 0} max={survey.target_count} /><div className="survey-card__footer"><span>{isOwner ? `목표 ${survey.target_count}명` : `약 ${survey.estimated_minutes || 5}분`}</span>{isOwner ? canViewResults ? <Link to={`/surveys/${survey.id}/results`}>결과 보기 →</Link> : <span>응답 대기 중</span> : <Link to={`/surveys/${survey.id}`}>참여하기 →</Link>}</div></article>
}
