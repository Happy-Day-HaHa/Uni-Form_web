import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeadlineLabel, isSurveyOpen, isTargetReached } from '../../utils/surveyPolicy'

export default function SurveyRow({ survey, index = 0, user, responded = false, isTeamSurvey = false, newSurveyId = '' }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const isOwner = survey.creator_id === user?.id
  const target = Math.max(Number(survey.target_count || 1), 1)
  const responses = Number(survey.response_count || 0)
  const progress = Math.min(100, Math.round((responses / target) * 100))
  const open = isSurveyOpen(survey)
  const destination = isOwner ? `/my-surveys/${survey.id}/manage` : (!responded && open ? `/surveys/${survey.id}` : '')
  const openSurvey = () => {
    if (!destination || busy) return
    setBusy(true)
    window.setTimeout(() => navigate(destination), 260)
  }

  return (
    <article className={`catalog-row ${survey.id === newSurveyId ? 'catalog-row--new' : ''}`} data-catalog-reveal style={{ '--catalog-delay': `${Math.min(index, 3) * 35}ms` }}>
      <div className="catalog-row__copy">
        <div><h2>{survey.title}</h2><span className="catalog-row__badges">{isOwner && <em>내 설문</em>}{isTeamSurvey && <em>우리 팀</em>}{responded && <em>응답 완료</em>}{isTargetReached(survey) && <em>목표 달성</em>}{getDeadlineLabel(survey.deadline) && <em>{getDeadlineLabel(survey.deadline)}</em>}</span></div>
        <p>{survey.description}</p>
        <ul><li>약 {survey.estimated_minutes || 5}분</li><li>{survey.category || '전체'}</li><li>{responses.toLocaleString()}명 참여 중</li></ul>
      </div>
      <div className="catalog-row__progress"><span>{responses.toLocaleString()} / {target.toLocaleString()}명</span><div><i style={{ width: `${progress}%` }} /><b>{progress}%</b></div></div>
      {destination
        ? <button className="catalog-row__action" type="button" disabled={busy} onClick={openSurvey}>{busy ? '불러오는 중…' : isOwner ? '관리하기' : '참여하기'}</button>
        : <button className="catalog-row__action" type="button" disabled>{responded ? '응답 완료' : '마감'}</button>}
      <button className="catalog-row__more" type="button" aria-label="더보기">⋮</button>
    </article>
  )
}
