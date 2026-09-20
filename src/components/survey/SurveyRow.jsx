import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SurveyRow({ survey, index = 0, user, newSurveyId = '' }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const isOwner = survey.creator_id === user?.id
  const target = Math.max(Number(survey.target_count || 1), 1)
  const responses = Number(survey.response_count || 0)
  const progress = Math.min(100, Math.round((responses / target) * 100))
  const remaining = Math.max(0, target - responses)
  const destination = isOwner ? `/my-surveys/${survey.id}/manage` : `/surveys/${survey.id}`
  const openSurvey = () => {
    if (!destination || busy) return
    setBusy(true)
    window.setTimeout(() => navigate(destination), 260)
  }

  return (
    <article className={`catalog-row ${survey.id === newSurveyId ? 'catalog-row--new' : ''}`} data-catalog-reveal style={{ '--catalog-delay': `${Math.min(index, 3) * 35}ms` }}>
      <div className="catalog-row__copy">
        <div><h2>{survey.title}</h2>{index === 0 && <span className="catalog-tag">추천</span>}</div>
        <p>{survey.description}</p>
        <ul><li>약 {survey.estimated_minutes || 5}분</li><li>{survey.category || '전체'}</li><li>{responses.toLocaleString()}명 참여 중</li></ul>
      </div>
      <div className="catalog-row__progress"><span>잔여 {remaining.toLocaleString()}명</span><div><i style={{ width: `${progress}%` }} /><b>{progress}%</b></div></div>
      {destination
        ? <button className="catalog-row__action" type="button" disabled={busy} onClick={openSurvey}>{busy ? '불러오는 중…' : isOwner ? '관리하기' : '참여하기'}</button>
        : <span className="catalog-row__waiting">응답 대기 중</span>}
      <button className="catalog-row__more" type="button" aria-label="더보기">⋮</button>
    </article>
  )
}
