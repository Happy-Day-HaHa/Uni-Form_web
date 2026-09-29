import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { getMyResponses } from '../services/responseService'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
}

// 내가 참여한 설문 목록. 운영자가 부정 응답으로 집계에서 제외한 응답은 따로 표시한다.
export default function MyResponses() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getMyResponses()
      .then((next) => { if (active) setItems(next) })
      .catch((reason) => { if (active) setError(`내 응답을 불러오지 못했어요. ${reason.message}`) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const excludedCount = items.filter((item) => item.excluded).length

  return <ServiceShell activePath="/my-responses"><div>
    <ServiceHeading icon="✓" title="내 응답" description="참여한 설문과 응답 처리 상태를 확인할 수 있어요." />
    {error && <div className="component-error" role="alert">{error}<button type="button" onClick={() => setReloadKey((key) => key + 1)}>다시 시도</button></div>}
    {excludedCount > 0 && <p className="my-responses__notice" role="status">부정 응답으로 처리된 응답이 {excludedCount}건 있어요. 처리된 응답은 설문 결과와 리더보드 집계에서 제외됩니다. 이의가 있으면 <Link to="/support">고객센터</Link>로 문의해주세요.</p>}
    {loading ? <div className="catalog-skeleton" aria-label="내 응답을 불러오는 중">{Array.from({ length: 3 }, (_, index) => <div key={index}><span /><p /><i /></div>)}</div>
      : <section className="managed-list">
        {items.map((item) => <article className={`managed-row ui-card ${item.excluded ? 'my-responses__row--excluded' : ''}`} key={item.surveyId}>
          <div className="managed-row__title"><div>
            <div className="managed-title-line"><h2>{item.surveyTitle}</h2>
              {item.excluded ? <em className="survey-state survey-state--excluded">부정 응답으로 처리됨</em>
                : item.status === 'submitted' ? <em className="survey-state survey-state--success">제출 완료</em>
                : <em className="survey-state survey-state--active">작성 중</em>}
            </div>
            {item.excluded && <p className="my-responses__reason">사유: {item.excludedReason || '운영 정책 위반'}</p>}
            <small>{item.status === 'submitted' ? `${formatDate(item.submittedAt)} 제출` : '아직 제출하지 않았어요'}{item.status === 'submitted' && item.points != null ? ` · 참여 +${item.points}회${item.excluded ? ' (집계 제외)' : ''}` : ''}</small>
          </div></div>
          <div className="managed-actions">{item.status === 'in_progress' ? <Link className="managed-primary" to={`/surveys/${item.surveyId}`}>이어서 응답</Link> : null}</div>
        </article>)}
        {!items.length && <section className="result-empty"><span>✓</span><h2>아직 참여한 설문이 없어요.</h2><p>설문에 참여하면 여기에서 기록을 확인할 수 있어요.</p><Link className="ui-button ui-button--secondary" to="/surveys">설문 둘러보기</Link></section>}
      </section>}
  </div></ServiceShell>
}
