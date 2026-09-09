import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import FormMatePanel from '../components/formmate/FormMatePanel'
import ResultOverview from '../components/result/ResultOverview'
import SurveyFilters from '../components/survey/SurveyFilters'
import SurveyEditorPanel from '../components/survey/SurveyEditorPanel'
import SurveyRow from '../components/survey/SurveyRow'
import { useReveal } from '../hooks/useReveal'
import { demoSurveys } from '../services/surveyService'
import '../styles/landing-canva.css'

const journey = [
  ['01', '설문 만들기', '목적과 질문을 정리해 설문을 빠르게 시작하세요.'],
  ['02', '응답자 설정', '필요한 조건과 공개 범위를 간단하게 정합니다.'],
  ['03', '참여자 모집', '공개된 설문이 필요한 응답자와 자연스럽게 만납니다.'],
  ['04', '결과 확인', '모인 응답과 핵심 흐름을 한곳에서 확인하세요.'],
]

function ProductFrame({ label, children, className = '', ...props }) {
  return <div className={`uf-product-frame ${className}`} {...props}><div className="uf-product-frame__bar"><i /><i /><i /><span>{label}</span></div><div className="uf-product-frame__canvas">{children}</div></div>
}

export default function Landing() {
  const navigate = useNavigate()
  const rootRef = useReveal([])
  const [prompt, setPrompt] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState('추천순')
  const [duration, setDuration] = useState('전체 시간')
  const [previewForm, setPreviewForm] = useState({ title: '대학생의 AI 서비스 사용 경험 조사', description: 'AI 서비스 이용 경험과 만족도를 알아보는 설문입니다.', category: '테크', targetCount: 500, estimatedMinutes: 5, ageGroup: '20대', visibility: '전체 공개', questions: [{ id: 'preview-q1', type: 'single', title: '평소 어떤 AI 서비스를 주로 이용하시나요?', options: ['대화형 AI', '이미지 생성', '번역·요약'] }, { id: 'preview-q2', type: 'scale', title: 'AI 서비스 전반에 얼마나 만족하시나요?', options: [], min: 1, max: 5 }] })

  const visibleSurveys = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko')
    const filtered = demoSurveys.filter((survey) => {
      const minutes = Number(survey.estimated_minutes || 5)
      return (!keyword || `${survey.title} ${survey.description}`.toLocaleLowerCase('ko').includes(keyword))
        && (category === '전체' || survey.category === category)
        && (duration === '전체 시간' || (duration === '3분 이내' && minutes <= 3) || (duration === '5분 이내' && minutes <= 5) || (duration === '6분 이상' && minutes >= 6))
    })
    return [...filtered].sort((a, b) => {
      if (sort === '인기순') return b.response_count - a.response_count
      if (sort === '소요시간순') return a.estimated_minutes - b.estimated_minutes
      if (sort === '최신순') return String(b.id).localeCompare(String(a.id))
      return (b.response_count / b.target_count) - (a.response_count / a.target_count)
    })
  }, [category, duration, query, sort])

  function openFormMate() {
    if (prompt.trim().length < 5) {
      setFormMessage('알아보고 싶은 내용을 조금 더 구체적으로 적어주세요.')
      return
    }
    navigate('/surveys/create', { state: { formMatePrompt: prompt.trim() } })
  }

  const resultSurvey = demoSurveys.find((survey) => survey.id === 'campus-life')

  return <main className="uf-landing motion-page" ref={rootRef}>
    <nav className="uf-nav" aria-label="주요 메뉴">
      <Link className="uf-nav__brand" to="/"><BrandMark /></Link>
      <div className="uf-nav__actions"><Link className="uf-nav__signup" to="/signup">회원가입</Link><Link className="uf-button uf-button--primary uf-button--login" to="/login">로그인</Link></div>
    </nav>

    <section className="uf-hero" aria-labelledby="hero-title">
      <div className="uf-hero__copy">
        <span className="uf-kicker" data-motion-reveal>UNIFORM</span>
        <h1 id="hero-title" data-motion-reveal style={{ '--delay': '70ms' }}>설문은 간단하게,<br />결과는 <span>선명하게.</span></h1>
        <p data-motion-reveal style={{ '--delay': '140ms' }}>설문 제작부터 응답 참여, 결과 확인까지.<br />복잡했던 과정을 하나의 흐름으로 연결합니다.</p>
        <div className="uf-hero__actions" data-motion-reveal style={{ '--delay': '210ms' }}><Link className="uf-button uf-button--primary" to="/surveys">설문 참여하기 <span>→</span></Link><Link className="uf-button uf-button--secondary" to="/surveys/create">설문 만들기 <span>→</span></Link></div>
      </div>
      <ProductFrame label="uniform.app/surveys" className="uf-hero__product">
        <div className="uf-product-heading"><span>▤</span><div><small>설문 목록</small><h2>지금 참여할 수 있는 설문</h2></div></div>
        <div className="uf-hero-row"><SurveyRow survey={demoSurveys[0]} index={0} /></div>
        <div className="uf-hero-row"><SurveyRow survey={demoSurveys[4]} index={1} /></div>
      </ProductFrame>
    </section>

    <section className="uf-section uf-how" id="how">
      <div className="uf-section__heading" data-motion-reveal><span>이용 흐름</span><h2>필요한 과정만,<br />자연스럽게 이어집니다.</h2><p>찾고, 만들고, 응답하고, 확인하는 모든 순간을 하나의 제품 경험으로 정리했습니다.</p></div>
      <ol className="uf-journey">{journey.map(([no, title, copy], index) => <li key={no} data-motion-reveal style={{ '--delay': `${index * 70}ms` }}><span>{no}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol>
    </section>

    <section className="uf-section uf-discovery" id="discovery">
      <div className="uf-section__heading" data-motion-reveal><span>설문 찾기</span><h2>참여할 설문을<br />쉽게 발견하세요.</h2><p>검색과 필터로 필요한 설문을 찾고, 소요 시간과 모집 현황을 확인한 뒤 바로 참여할 수 있어요.</p></div>
      <ProductFrame label="uniform.app/surveys" className="uf-discovery__product" data-motion-reveal>
        <SurveyFilters query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} sort={sort} onSortChange={setSort} duration={duration} onDurationChange={setDuration} />
        <p className="catalog-count">총 <strong>{visibleSurveys.length}개</strong>의 설문이 있습니다.</p>
        <div className="catalog-list">{visibleSurveys.slice(0, 3).map((survey, index) => <SurveyRow key={survey.id} survey={survey} index={index} />)}{!visibleSurveys.length && <div className="catalog-empty">조건에 맞는 설문이 없습니다.</div>}</div>
      </ProductFrame>
    </section>

    <section className="uf-section uf-feature uf-feature--formmate" id="formmate">
      <div className="uf-feature__copy" data-motion-reveal><span>FORMMATE</span><h2>떠오른 생각을,<br />설문의 시작으로.</h2><p>목적을 편하게 적으면 질문과 보기를 빠르게 구성합니다. 제안받은 초안은 실제 편집 화면에서 바로 다듬을 수 있어요.</p><Link className="uf-text-link" to="/surveys/create">직접 설문 만들기 <span>→</span></Link></div>
      <ProductFrame label="uniform.app/surveys/create" className="uf-feature__product uf-feature__product--create" data-motion-reveal style={{ '--delay': '90ms' }}><div className="uf-create-preview"><SurveyEditorPanel form={previewForm} onChange={(patch) => setPreviewForm((current) => ({ ...current, ...patch }))} onQuestionChange={(id, patch) => setPreviewForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }))} onAddQuestion={() => setPreviewForm((current) => ({ ...current, questions: [...current.questions, { id: `preview-${current.questions.length + 1}`, type: 'text', title: '', options: [] }] }))} onDeleteQuestion={(id) => setPreviewForm((current) => ({ ...current, questions: current.questions.filter((question) => question.id !== id) }))} aiApplied /><FormMatePanel value={prompt} onChange={(value) => { setPrompt(value); setFormMessage('') }} onCreateDraft={openFormMate} message={formMessage} buttonLabel="FormMate로 시작하기" /></div></ProductFrame>
    </section>

    <section className="uf-section uf-feature uf-feature--results" id="results">
      <ProductFrame label="uniform.app/results" className="uf-feature__product" data-motion-reveal><div className="uf-result-preview"><div className="uf-product-heading"><span>▥</span><div><small>결과 보고서</small><h2>{resultSurvey.title}</h2></div></div><ResultOverview survey={resultSurvey} sampleCount={resultSurvey.response_count} summary="공간 이용과 생활 습관의 응답 흐름을 먼저 확인해보세요. 응답이 쌓일수록 비교할 수 있는 결과가 더 선명해집니다." /></div></ProductFrame>
      <div className="uf-feature__copy" data-motion-reveal style={{ '--delay': '90ms' }}><span>결과 분석</span><h2>모인 응답을,<br />바로 이해하세요.</h2><p>복잡하게 다시 정리하지 않아도 응답 수와 목표 달성률, 문항별 흐름을 한 화면에서 확인할 수 있습니다.</p><Link className="uf-text-link" to="/reports">결과 화면 살펴보기 <span>→</span></Link></div>
    </section>

    <section className="uf-final" data-motion-reveal><div><span>지금 시작하기</span><h2>설문이 필요한 순간,<br />바로 시작하세요.</h2><p>참여도, 제작도, 결과 확인도 UniForm에서 간편하게 이어집니다.</p><div><Link className="uf-button uf-button--primary" to="/surveys">설문 참여하기 <span>→</span></Link><Link className="uf-button uf-button--secondary" to="/surveys/create">설문 만들기 <span>→</span></Link></div></div></section>
    <footer className="uf-footer"><BrandMark /><nav><a href="#how">이용 방법</a><a href="#discovery">설문 찾기</a><a href="#formmate">FormMate</a><a href="#results">결과 분석</a></nav><small>© 2026 UNIFORM</small></footer>
  </main>
}
