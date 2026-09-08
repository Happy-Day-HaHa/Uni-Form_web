import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../hooks/useAuth'
import { getSurveys } from '../services/surveyService'
import { getProfile } from '../services/userService'
import { matchesProfile } from '../utils/surveyFilter'
import '../styles/survey-catalog.css'

const categories = ['전체', '교육', '라이프스타일', '소비', '테크', '문화']
const categoryMarks = { 교육: 'A', 라이프스타일: '○', 소비: '◇', 테크: 'AI', 문화: '✦' }

export default function SurveyList() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState('추천순')
  const [duration, setDuration] = useState('전체 시간')
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
          <NavLink to="/dashboard"><span aria-hidden="true">▤</span>내 설문</NavLink>
          <NavLink to="/surveys" end><span aria-hidden="true">▣</span>설문 목록</NavLink>
          <NavLink to="/dashboard"><span aria-hidden="true">▥</span>결과 보고서</NavLink>
          <NavLink to="/profile"><span aria-hidden="true">⚙</span>설정</NavLink>
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
            ? <Link className="catalog-user" to="/profile"><span>{(user.email || 'U').slice(0, 1).toUpperCase()}</span><b>{user.email?.split('@')[0] || '사용자'}님</b></Link>
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

          <section className="catalog-tools" data-catalog-reveal>
            <label className="catalog-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="설문 제목이나 키워드로 검색해보세요." /></label>
            <div className="catalog-filter-rail" aria-label="설문 필터">
              {categories.map((item) => <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
              <select aria-label="정렬" value={sort} onChange={(event) => setSort(event.target.value)}><option>추천순</option><option>인기순</option><option>최신순</option><option>소요시간순</option></select>
              <select aria-label="소요시간" value={duration} onChange={(event) => setDuration(event.target.value)}><option>전체 시간</option><option>3분 이내</option><option>5분 이내</option><option>6분 이상</option></select>
            </div>
          </section>

          {!loading && !error && <p className="catalog-count" data-catalog-reveal>총 <strong>{visibleSurveys.length}개</strong>의 설문이 있습니다.</p>}
          {loading && <div className="catalog-empty">설문을 불러오고 있어요.</div>}
          {error && <div className="catalog-empty">{error}</div>}

          {!loading && !error && (
            <section className="catalog-list" aria-live="polite">
              {visibleSurveys.map((survey, index) => {
                const isOwner = survey.creator_id === user?.id
                const canViewResults = isOwner && survey.response_count > 0
                const target = Math.max(Number(survey.target_count || 1), 1)
                const responses = Number(survey.response_count || 0)
                const progress = Math.min(100, Math.round((responses / target) * 100))
                const remaining = Math.max(0, target - responses)
                const destination = isOwner ? (canViewResults ? `/surveys/${survey.id}/results` : '') : `/surveys/${survey.id}`
                return (
                  <article className="catalog-row" key={survey.id} data-catalog-reveal style={{ '--catalog-delay': `${Math.min(index, 6) * 55}ms` }}>
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
              })}
              {!visibleSurveys.length && <div className="catalog-empty">조건에 맞는 설문이 없습니다. 다른 필터를 선택해보세요.</div>}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
