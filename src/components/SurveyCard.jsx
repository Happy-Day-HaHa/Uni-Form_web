import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import { formatPoints } from '../utils/pointCalculator'

export default function SurveyCard({ survey }) {
  return <article className="survey-card"><div className="survey-card__top"><span className="tag">{survey.category || '일반'}</span><strong>{formatPoints(survey.reward_points)}</strong></div><h2>{survey.title}</h2><p>{survey.description}</p><ProgressBar value={survey.response_count || 0} max={survey.target_count} /><div className="survey-card__footer"><span>약 {survey.estimated_minutes || 5}분</span><Link to={`/surveys/${survey.id}`}>참여하기 →</Link></div></article>
}
