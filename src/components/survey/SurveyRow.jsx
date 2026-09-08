import { Link } from 'react-router-dom'

const categoryMarks = { 교육: 'A', 라이프스타일: '○', 소비: '◇', 테크: 'AI', 문화: '✦' }

export default function SurveyRow({ survey, index = 0, user, newSurveyId = '' }) {
  const isOwner = survey.creator_id === user?.id
  const canViewResults = isOwner && survey.response_count > 0
  const target = Math.max(Number(survey.target_count || 1), 1)
  const responses = Number(survey.response_count || 0)
  const progress = Math.min(100, Math.round((responses / target) * 100))
  const remaining = Math.max(0, target - responses)
  const destination = isOwner ? (canViewResults ? `/surveys/${survey.id}/results` : '') : `/surveys/${survey.id}`

  return (
    <article className={`catalog-row ${survey.id === newSurveyId ? 'catalog-row--new' : ''}`} data-catalog-reveal style={{ '--catalog-delay': `${Math.min(index, 5) * 70}ms` }}>
      <span className={`catalog-row__icon catalog-row__icon--${index % 5}`} aria-hidden="true">{categoryMarks[survey.category] || 'U'}</span>
      <div className="catalog-row__copy">
        <div><h2>{survey.title}</h2>{index === 0 && <span className="catalog-tag">추천</span>}</div>
        <p>{survey.description}</p>
        <ul><li>◷ 약 {survey.estimated_minutes || 5}분</li><li>◎ {survey.category || '전체'}</li><li>♧ {responses.toLocaleString()}명 참여 중</li></ul>
      </div>
      <div className="catalog-row__progress"><span>잔여 {remaining.toLocaleString()}명</span><div><i style={{ width: `${progress}%` }} /><b>{progress}%</b></div></div>
      {destination
        ? <Link className="catalog-row__action" to={destination}>{isOwner ? '결과 보기' : '참여하기'} <span>→</span></Link>
        : <span className="catalog-row__waiting">응답 대기 중</span>}
    </article>
  )
}
