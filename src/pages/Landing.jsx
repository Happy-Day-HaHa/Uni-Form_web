import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import '../styles/landing.css'

const steps = [
  { no: '01', label: 'START', title: '가볍게 시작', copy: '이메일 하나로 가입하고, 필요한 설문을 바로 찾아볼 수 있어요.' },
  { no: '02', label: 'CREATE', title: '대화하듯 제작', copy: '목적을 적으면 Uni-Chat이 질문과 보기를 빠르게 구성해줘요.' },
  { no: '03', label: 'RESPOND', title: '쉽게 참여', copy: '열려 있는 설문을 둘러보고 복잡한 절차 없이 바로 응답해요.' },
  { no: '04', label: 'REVIEW', title: '한눈에 확인', copy: '모인 응답은 그래프와 핵심 요약으로 보기 좋게 정리돼요.' },
]

const filterCategories = ['전체', '교육', '라이프스타일', '소비']

const sampleSurveys = [
  ['교육', '더 나은 캠퍼스 라이프를 위한 설문', '4분', 68],
  ['라이프스타일', '나의 아침 루틴과 생산성', '3분', 34],
  ['소비', '친환경 소비 선택 조사', '6분', 77],
]

export default function Landing() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [aiApplied, setAiApplied] = useState(false)
  const visibleSurveys = useMemo(
    () => activeCategory === '전체' ? sampleSurveys : sampleSurveys.filter(([category]) => category === activeCategory),
    [activeCategory],
  )

  useEffect(() => {
    const items = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14 },
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return <main className="blue-landing">
    <nav className="blue-nav" aria-label="주요 메뉴">
      <Link to="/" aria-label="UNI-FORM 홈"><BrandMark /></Link>
      <div className="blue-nav__menu"><a href="#flow">이용 방법</a><a href="#surveys">설문 둘러보기</a><a href="#results">결과 분석</a></div>
      <div className="blue-nav__actions"><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link></div>
    </nav>

    <section className="blue-hero" aria-labelledby="blue-hero-title">
      <div className="blue-hero__copy" data-reveal>
        <span className="blue-hero__index" aria-hidden="true">01</span>
        <p className="blue-eyebrow">AI SURVEY WORKSPACE</p>
        <h1 id="blue-hero-title">설문은 간단하게,<br />결과는 선명하게.</h1>
        <p>만들고, 참여하고, 정리하는 과정을<br />하나의 편한 흐름으로 연결합니다.</p>
        <div className="blue-hero__actions"><Link className="blue-button blue-button--dark" to="/surveys">설문 시작하기 <span>→</span></Link><Link className="blue-text-link" to="/signup">처음이라면 회원가입</Link></div>
      </div>
      <figure className="blue-hero__art"><img src="/uniform-network-hero.jpeg" alt="다양한 대학 연구 주제가 연결된 네트워크" /></figure>
      <a className="blue-scroll" href="#flow">SCROLL <span>↓</span></a>
    </section>

    <section className="blue-flow" id="flow">
      <header data-reveal><span className="blue-section-index">02</span><div><p className="blue-eyebrow">ONE SIMPLE FLOW</p><h2>복잡했던 설문을,<br />한 흐름으로 줄였어요.</h2></div></header>
      <ol>{steps.map((step) => <li key={step.no} data-reveal><div><span>{step.no}</span><small>{step.label}</small></div><h3>{step.title}</h3><p>{step.copy}</p><b aria-hidden="true">↗</b></li>)}</ol>
    </section>

    <section className="blue-surveys" id="surveys">
      <div className="blue-section-copy" data-reveal><span className="blue-section-index">03</span><p className="blue-eyebrow">SURVEY BOARD</p><h2>찾고, 참여하고,<br />만드는 일까지 한곳에서.</h2><p>진행 중인 설문은 옆으로 넘겨 빠르게 살펴보고 바로 참여하세요. 새 설문이 필요할 때는 <b>+ 만들기</b>를 누르면 곧바로 제작 화면이 열립니다.</p><Link className="blue-button blue-button--dark" to="/surveys">설문 둘러보기 <span>→</span></Link></div>
      <div className="blue-board" data-reveal>
        <header><div><small>AVAILABLE SURVEYS</small><strong>지금 참여할 수 있는 설문</strong></div><Link to="/surveys/create">+ 만들기</Link></header>
        <div className="blue-board__filters">{filterCategories.map((category) => <button type="button" key={category} className={category === activeCategory ? 'is-active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
        <div className="blue-board__grid">{visibleSurveys.map(([category, title, time, percent]) => <article key={title}><div><span>{category}</span><b>{percent}% 참여</b></div><h3>{title}</h3><p>응답 현황 <strong>{percent}%</strong></p><i><b style={{ width: `${percent}%` }} /></i><footer><span>약 {time}</span><Link to="/surveys">참여하기 →</Link></footer></article>)}{!visibleSurveys.length && <p className="blue-board__empty">해당 카테고리의 설문이 아직 없어요.</p>}</div>
      </div>
    </section>

    <section className="blue-ai" data-reveal>
      <div><span className="blue-section-index">04</span><p className="blue-eyebrow">UNI-CHAT WORKSPACE</p><h2>막막한 설문도,<br />대화하듯 간단하게.</h2><p>목적과 대상만 알려주면 질문, 보기, 순서를 함께 구성해요. 제안받은 문항은 고쳐 쓰거나 한 번에 설문으로 옮길 수 있습니다.</p></div>
      <div className="blue-ai__chat">
        <header><span>U</span><div><b>Uni-Chat</b><small>설문 제작 파트너</small></div><i><b /> 준비됨</i></header>
        <div className="blue-ai__thread"><p className="blue-ai__assistant">어떤 설문을 만들까요?<br /><span>목적과 응답 대상만 편하게 알려주세요.</span></p><p className="blue-ai__user">대학생의 통학 경험과 만족도를 알아보고 싶어요.</p></div>
        <article><small>질문 초안을 만들었어요</small><b>통학 경험 설문 · 총 3문항</b><span><em>01 · 객관식</em> 주로 이용하는 교통수단은 무엇인가요?</span><span><em>02 · 척도형</em> 현재 통학 시간에 얼마나 만족하나요?</span><span><em>03 · 주관식</em> 가장 개선되었으면 하는 점은 무엇인가요?</span><button type="button" className={aiApplied ? 'is-applied' : ''} disabled={aiApplied} onClick={() => setAiApplied(true)}>{aiApplied ? '설문에 반영했어요 ✓' : '이 초안을 설문에 반영 →'}</button></article>
        <div className="blue-ai__composer"><span>바꾸고 싶은 내용을 이어서 입력하세요</span><b>→</b></div>
      </div>
    </section>

    <section className="blue-results" id="results">
      <div className="blue-result-panel" data-reveal><header><span>RESULT REPORT</span><b>응답 82건</b></header><h3>통학 만족도 조사</h3><div className="blue-result-stats"><article><span>전체 응답</span><strong>82</strong><small>목표의 82%</small></article><article><span>평균 만족도</span><strong>3.8</strong><small>5점 만점</small></article></div><div className="blue-bars" aria-hidden="true">{[54, 82, 65, 96, 72, 88].map((height, index) => <i key={index} style={{ '--height': `${height}%` }} />)}</div><aside><span>✦ AI 핵심 요약</span><p>응답자는 환승 횟수보다 통학 시간의 예측 가능성을 더 중요하게 느껴요.</p></aside></div>
      <div className="blue-section-copy" data-reveal><span className="blue-section-index">05</span><p className="blue-eyebrow">CLEAR RESULTS</p><h2>모인 응답은,<br />한눈에 정리돼요.</h2><p>복잡한 표를 직접 정리하지 않아도 괜찮아요. 응답 수, 문항별 분포, 주관식 의견과 핵심 내용을 보기 쉬운 결과로 자동 정리합니다.</p><Link className="blue-button blue-button--dark" to="/dashboard">결과 화면 살펴보기 <span>→</span></Link></div>
    </section>

    <section className="blue-final" data-reveal><span className="blue-section-index">06</span><p className="blue-eyebrow">READY WHEN YOU ARE</p><h2>설문이 필요할 때,<br />바로 시작하세요.</h2><div><Link className="blue-button blue-button--dark" to="/surveys">설문 시작하기 <span>→</span></Link><Link className="blue-button blue-button--light" to="/signup">회원가입</Link></div></section>
    <footer className="blue-footer"><BrandMark light /><p>질문과 사람 사이를 더 가볍게.</p><div><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link><Link to="/surveys">설문 목록</Link><a href="http://www.freepik.com" target="_blank" rel="noreferrer">Designed by Freepik</a></div><small>© 2026 UNI-FORM</small></footer>
  </main>
}
