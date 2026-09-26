import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ServiceShell from '../components/ServiceShell'
import SurveyFilters from '../components/survey/SurveyFilters'
import SurveyRow from '../components/survey/SurveyRow'
import { useAuth } from '../hooks/useAuth'
import { getSurveys } from '../services/surveyService'
import { getRespondedSurveyIds } from '../services/responseService'
import { getMyTeam } from '../services/teamService'
import '../styles/survey-catalog.css'

export default function SurveyList() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState(params.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [category, setCategory] = useState(params.get('category') || '전체')
  const [respondedIds, setRespondedIds] = useState([])
  const [teamSurveyIds, setTeamSurveyIds] = useState([])
  const [duration, setDuration] = useState(params.get('duration') || '전체 시간')
  const [newSurveyId] = useState(() => {
    try { const id = sessionStorage.getItem('uni-form-new-survey') || ''; sessionStorage.removeItem('uni-form-new-survey'); return id } catch { return '' }
  })
  const [visibleCount, setVisibleCount] = useState(20)
  const listRef = useRef(null)

  useEffect(() => {
    // 로그인 확인 전(user 없음)과 후에 두 번 불리므로, 늦게 끝난 이전 요청이 결과를 덮어쓰지 않게 한다.
    let active = true
    Promise.all([getSurveys(), getRespondedSurveyIds(user?.id), getMyTeam()])
      .then(([items, ids, team]) => { if (!active) return; setSurveys(items); setRespondedIds(ids); setTeamSurveyIds((team?.surveys || []).map((survey) => survey.id)); setError('') })
      .catch((reason) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query), 260); return () => window.clearTimeout(timer) }, [query])
  useEffect(() => {
    const next = {}
    if (debouncedQuery) next.q = debouncedQuery
    if (category !== '전체') next.category = category
    if (duration !== '전체 시간') next.duration = duration
    setParams(next, { replace: true })
  }, [category, debouncedQuery, duration, setParams])

  const visibleSurveys = useMemo(() => {
    const keyword = debouncedQuery.trim().toLocaleLowerCase('ko')
    const filtered = surveys.filter((survey) => {
      const matchesKeyword = !keyword || `${survey.title} ${survey.description}`.toLocaleLowerCase('ko').includes(keyword)
      const matchesCategory = category === '전체' || survey.category === category
      const minutes = Number(survey.estimated_minutes || 5)
      const matchesDuration = duration === '전체 시간'
        || (duration === '3분 이내' && minutes <= 3)
        || (duration === '5분 이내' && minutes <= 5)
        || (duration === '6분 이상' && minutes >= 6)
      return matchesKeyword && matchesCategory && matchesDuration
    })

    return [...filtered].sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)))
  }, [category, debouncedQuery, duration, surveys])

  useEffect(() => { setVisibleCount(20) }, [category, debouncedQuery, duration])
  const pagedSurveys = visibleSurveys.slice(0, visibleCount)

  useEffect(() => {
    const root = listRef.current
    if (!root) return undefined
    const items = root.querySelectorAll('[data-catalog-reveal]')
    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.16, rootMargin: '0px 0px -5% 0px' },
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [pagedSurveys])

  const available = surveys.length
  const averageMinutes = surveys.length
    ? Math.round(surveys.reduce((sum, survey) => sum + Number(survey.estimated_minutes || 5), 0) / surveys.length)
    : 0

  return (
    <ServiceShell activePath="/surveys">
      <div className="catalog-content catalog-content--service" ref={listRef}>
          <section className="catalog-heading" data-catalog-reveal>
            <div><h1>설문 목록</h1><p>{user ? '나와 잘 맞는 설문을 확인하고 바로 참여해보세요.' : '참여 가능한 설문을 확인하고 간편하게 시작해보세요.'}</p></div>
            <Link className="ui-button catalog-heading__action" to="/formmate">FormMate로 설문 만들기</Link>
          </section>

          <p className="catalog-overview" data-catalog-reveal>참여 가능한 설문 <b>{available}개</b><span>평균 소요시간 {averageMinutes}분</span></p>

          <div data-catalog-reveal><SurveyFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} duration={duration} onDurationChange={setDuration} /></div>

          {!loading && !error && <p className="catalog-count" data-catalog-reveal>총 <strong>{visibleSurveys.length}개</strong>의 설문이 있습니다.</p>}
          {loading && <div className="catalog-skeleton" aria-label="설문을 불러오고 있어요">{Array.from({ length: 4 }, (_, index) => <div key={index}><span /><p /><i /></div>)}</div>}
          {error && <div className="catalog-empty">{error}</div>}

          {!loading && !error && (
            <section className="catalog-list" aria-live="polite">
              {pagedSurveys.map((survey, index) => <SurveyRow key={survey.id} survey={survey} index={index} user={user} responded={respondedIds.includes(survey.id)} isTeamSurvey={teamSurveyIds.includes(survey.id)} newSurveyId={newSurveyId} />)}
              {!visibleSurveys.length && <div className="catalog-empty"><b>조건에 맞는 설문이 없습니다.</b><span>검색어나 필터를 바꿔보세요.</span><button className="ui-button ui-button--secondary" type="button" onClick={() => { setQuery(''); setCategory('전체'); setDuration('전체 시간') }}>필터 초기화</button></div>}
            </section>
          )}
          {!loading && !error && visibleCount < visibleSurveys.length && <button className="catalog-load-more" type="button" onClick={() => setVisibleCount((count) => count + 20)}>더 보기 ({visibleSurveys.length - visibleCount}개 더 있음)</button>}
      </div>
    </ServiceShell>
  )
}
