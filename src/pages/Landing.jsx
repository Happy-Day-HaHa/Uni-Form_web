import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import '../styles/landing-canva.css'

const journey = [
  {
    no: '01',
    title: '설문 등록',
    lead: '준비한 설문을 간편하게 등록하세요.',
    copy: '설문 정보와 예상 소요시간, 필요한 응답 인원을 설정합니다.',
  },
  {
    no: '02',
    title: '응답자 설정',
    lead: '내 설문에 필요한 사람을 선택하세요.',
    copy: '학교, 학년, 전공 등 원하는 조건에 맞춰 응답 대상을 설정합니다.',
  },
  {
    no: '03',
    title: '참여자 모집',
    lead: '조건에 맞는 참여자에게 설문을 연결합니다.',
    copy: '필요한 응답을 빠르고 편리하게 모을 수 있습니다.',
  },
  {
    no: '04',
    title: '결과 확인',
    lead: '모인 응답을 한곳에서 확인하세요.',
    copy: '응답 현황부터 결과까지 편리하게 확인하고 활용할 수 있습니다.',
  },
]

export default function Landing() {
  const [prompt, setPrompt] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const items = document.querySelectorAll('[data-reveal]')

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }),
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  const startWithFormMate = (event) => {
    event.preventDefault()
    navigate('/surveys/create', { state: { formMatePrompt: prompt.trim() } })
  }

  return (
    <main className="uf-landing">
      <nav className="uf-nav" aria-label="주요 메뉴">
        <Link className="uf-nav__brand" to="/" aria-label="UNIFORM 홈"><BrandMark /></Link>
        <div className="uf-nav__center">
          <a href="#how">이용 방법</a>
          <span aria-hidden="true">|</span>
          <a href="#formmate">Support</a>
        </div>
        <div className="uf-nav__actions">
          <Link to="/signup">회원가입</Link>
          <Link className="uf-nav__login" to="/login">로그인</Link>
        </div>
      </nav>

      <section className="uf-panel uf-hero" aria-labelledby="uf-hero-title">
        <span className="uf-watermark" aria-hidden="true">UNIFORM</span>
        <div className="uf-hero__content" data-reveal>
          <h1 id="uf-hero-title">
            <span>설문 응답자 모집,</span>
            <strong className="uf-highlight">이제 더 간편하게.</strong>
          </h1>
          <p>설문은 간단하게, 결과는 선명하게.</p>
          <Link className="uf-pill" to="/surveys">설문 참여하기</Link>
        </div>
        <a className="uf-scroll-cue" href="#how" aria-label="이용 방법으로 이동"><span>SCROLL</span><b>↓</b></a>
      </section>

      <section className="uf-panel uf-how" id="how" aria-labelledby="uf-how-title">
        <header data-reveal>
          <h2 id="uf-how-title">번거로운 설문 과정을<br /><span className="uf-highlight">하나의 경험으로</span></h2>
        </header>
        <ol className="uf-journey">
          {journey.map((step, index) => (
            <li key={step.no} data-reveal style={{ '--delay': `${index * 90}ms` }}>
              <div className="uf-journey__title"><span>{step.no}</span><h3>{step.title}</h3></div>
              <p><strong>{step.lead}</strong>{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="uf-panel uf-formmate" id="formmate" aria-labelledby="uf-formmate-title">
        <div className="uf-formmate__intro" data-reveal>
          <h2 id="uf-formmate-title">막막했던 설문,<br />이제는 <span className="uf-highlight">FormMate와</span><br />함께 시작하세요.</h2>
        </div>
        <form className="uf-formmate__card" onSubmit={startWithFormMate} data-reveal aria-label="FormMate로 설문 시작하기">
          <h3>FormMate</h3>
          <label htmlFor="formmate-prompt" className="sr-only">만들고 싶은 설문</label>
          <div className="uf-formmate__composer">
            <input
              id="formmate-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="어떤 설문이 하고 싶은가요?"
            />
            <button type="submit" aria-label="FormMate로 설문 만들기"><span aria-hidden="true">↗</span></button>
          </div>
          <p>목적을 한 문장으로 알려주면 질문과 보기 구성을 함께 시작해요.</p>
        </form>
      </section>

      <section className="uf-panel uf-results" id="results" aria-labelledby="uf-results-title">
        <div className="uf-results__copy" data-reveal>
          <h2 id="uf-results-title">응답의 흐름부터<br />결과까지, <span className="uf-highlight">한번에.</span></h2>
          <p>응답 현황과 핵심 결과를 복잡한 정리 없이 한 화면에서 확인하세요.</p>
          <Link className="uf-text-link" to="/dashboard">결과 화면 살펴보기 <span>↗</span></Link>
        </div>
        <div className="uf-results__visual" data-reveal>
          <img src="/uniform-result-report.png" alt="응답 수, 응답 시간, 성별과 학년 분포를 한눈에 보여주는 설문 결과 보고서" />
        </div>
      </section>

      <section className="uf-panel uf-final" aria-labelledby="uf-final-title">
        <span className="uf-watermark" aria-hidden="true">UNIFORM</span>
        <div data-reveal>
          <h2 id="uf-final-title">설문이 필요할 때,<br /><span className="uf-highlight">바로 시작하세요.</span></h2>
          <Link className="uf-pill" to="/surveys">설문 시작하기</Link>
        </div>
      </section>

      <footer className="uf-footer">
        <BrandMark light />
        <nav aria-label="하단 메뉴"><a href="#how">이용약관</a><span aria-hidden="true">|</span><Link to="/surveys">더 알아보기</Link></nav>
      </footer>
    </main>
  )
}
