import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import SurveyFilters from '../components/survey/SurveyFilters'
import SurveyRow from '../components/survey/SurveyRow'
import { useAuth } from '../hooks/useAuth'
import { getSurveys } from '../services/surveyService'
import { getProfile } from '../services/userService'
import { matchesProfile } from '../utils/surveyFilter'
import '../styles/survey-catalog.css'

export default function SurveyList() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState('추천순')
  const [duration, setDuration] = useState('전체 시간')
  const [newSurveyId] = useState(() => {
    try { const id = sessionStorage.getItem('uni-form-new-survey') || ''; sessionStorage.removeItem('uni-form-new-survey'); return id } catch { return '' }
  })
  const listRef = useRef(null)

  useEffect(() => {
    Promise.all([getSurveys(), user ? getProfile(user.id) : Promise.resolve(null)])
      .then(([items, profile]) => setSurveys(profile ? items.filter((survey) => matchesProfile(survey, profile)) : items))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [user])

  const visibleSurveys = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko')
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

    return [...filtered].sort((a, b) => {
      if (sort === '인기순') return (b.response_count || 0) - (a.response_count || 0)
      if (sort === '소요시간순') return (a.estimated_minutes || 5) - (b.estimated_minutes || 5)
      if (sort === '최신순') return String(b.created_at || b.id).localeCompare(String(a.created_at || a.id))
      const aRate = (a.response_count || 0) / Math.max(a.target_count || 1, 1)
      const bRate = (b.response_count || 0) / Math.max(b.target_count || 1, 1)
      return bRate - aRate
    })
  }, [category, duration, query, sort, surveys])

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
  }, [visibleSurveys])

  const available = surveys.filter((survey) => (survey.response_count || 0) < (survey.target_count || 1)).length
  const averageMinutes = surveys.length
    ? Math.round(surveys.reduce((sum, survey) => sum + Number(survey.estimated_minutes || 5), 0) / surveys.length)
    : 0

  return (
    <div className="survey-catalog">
      <aside className="catalog-sidebar">
        <Link to="/" className="catalog-sidebar__brand"><BrandMark /></Link>
        <nav aria-label="설문 메뉴">
          <NavLink to="/dashboard"><span aria-hidden="true">⌂</span>대시보드</NavLink>
          <NavLink to="/my-surveys"><span aria-hidden="true">▤</span>내 설문</NavLink>
          <NavLink to="/surveys" end><span aria-hidden="true">▣</span>설문 목록</NavLink>
          <NavLink to="/reports"><span aria-hidden="true">▥</span>결과 보고서</NavLink>
          <NavLink to="/activity"><span aria-hidden="true">◷</span>활동 내역</NavLink>
          <NavLink to="/settings"><span aria-hidden="true">⚙</span>설정</NavLink>
        </nav>
        <div className="catalog-sidebar__note">
          <span>NEW</span>
          <strong>필요한 설문을<br />빠르게 찾아보세요.</strong>
          <p>검색과 필터로 지금 참여할 설문을 한눈에 확인할 수 있어요.</p>
          <Link to="/surveys/create">설문 만들기 <b>→</b></Link>
        </div>
      </aside>

      <main className="catalog-main">
        <header className="catalog-topbar">
          <Link to="/" className="catalog-mobile-brand"><BrandMark /></Link>
          <Link className="catalog-create" to="/surveys/create">+ 새 설문 만들기</Link>
          {user
            ? <Link className="catalog-user" to="/settings"><span>{(user.email || 'U').slice(0, 1).toUpperCase()}</span><b>{user.email?.split('@')[0] || '사용자'}님</b></Link>
            : <Link className="catalog-user catalog-user--login" to="/login">로그인</Link>}
        </header>

        <div className="catalog-content" ref={listRef}>
          <section className="catalog-heading" data-catalog-reveal>
            <div className="catalog-heading__icon" aria-hidden="true">▤</div>
            <div><h1>설문 목록</h1><p>{user ? '나와 잘 맞는 설문을 확인하고 바로 참여해보세요.' : '참여 가능한 설문을 확인하고 간편하게 시작해보세요.'}</p></div>
          </section>

          <section className="catalog-summary" aria-label="설문 요약">
            <article data-catalog-reveal style={{ '--catalog-delay': '40ms' }}><span className="catalog-summary__mark">◎</span><div><small>참여 가능한 설문</small><strong>{available}<em>개</em></strong><p>지금 바로 참여할 수 있어요.</p></div></article>
            <article data-catalog-reveal style={{ '--catalog-delay': '100ms' }}><span className="catalog-summary__mark catalog-summary__mark--violet">N</span><div><small>새로 올라온 설문</small><strong>{Math.min(surveys.length, 3)}<em>개</em></strong><p>새로운 의견을 기다리고 있어요.</p></div></article>
            <article data-catalog-reveal style={{ '--catalog-delay': '160ms' }}><span className="catalog-summary__mark catalog-summary__mark--mint">⌁</span><div><small>평균 예상 소요시간</small><strong>{averageMinutes}<em>분</em></strong><p>부담 없이 빠르게 참여하세요.</p></div></article>
          </section>

          <div data-catalog-reveal><SurveyFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} sort={sort} onSortChange={setSort} duration={duration} onDurationChange={setDuration} /></div>

          {!loading && !error && <p className="catalog-count" data-catalog-reveal>총 <strong>{visibleSurveys.length}개</strong>의 설문이 있습니다.</p>}
          {loading && <div className="catalog-skeleton" aria-label="설문을 불러오고 있어요">{Array.from({ length: 4 }, (_, index) => <div key={index}><span /><p /><i /></div>)}</div>}
          {error && <div className="catalog-empty">{error}</div>}

          {!loading && !error && (
            <section className="catalog-list" aria-live="polite">
              {visibleSurveys.map((survey, index) => <SurveyRow key={survey.id} survey={survey} index={index} user={user} newSurveyId={newSurveyId} />)}
              {!visibleSurveys.length && <div className="catalog-empty">조건에 맞는 설문이 없습니다. 다른 필터를 선택해보세요.</div>}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
