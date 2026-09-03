import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import '../styles/landing.css'

const steps = [
  { no: '01', label: 'LOGIN', title: '로그인', copy: '대학 이메일로 로그인하고 내 설문과 참여 내역을 이어서 확인해요.' },
  { no: '02', label: 'SIGN UP', title: '회원가입', copy: '기본 프로필을 등록하면 나에게 맞는 설문을 추천받을 수 있어요.' },
  { no: '03', label: 'CREATE & ANSWER', title: 'AI 설문 제작 · 응답', copy: 'AI가 질문 초안을 만들고, 올라온 설문에는 바로 참여할 수 있어요.' },
  { no: '04', label: 'ANALYZE', title: '설문 결과 분석', copy: '내가 만든 설문에 응답이 들어오면 통계와 핵심 결과를 확인해요.' },
]

const filterCategories = ['전체', '교육', '라이프스타일', '소비']

const sampleSurveys = [
  ['교육', '더 나은 캠퍼스 라이프를 위한 설문', '4분', '320 P', 68],
  ['라이프스타일', '나의 아침 루틴과 생산성', '3분', '180 P', 34],
  ['소비', '친환경 소비 선택 조사', '6분', '450 P', 77],
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
        <p className="blue-eyebrow">AI SURVEY WORKSPACE</p>
        <h1 id="blue-hero-title">질문은 가볍게,<br />결과는 <em>선명하게.</em></h1>
        <p>설문 제작부터 응답 수집, 결과 분석까지.<br />대학생의 설문 과정을 하나로 연결합니다.</p>
        <div className="blue-hero__actions"><Link className="blue-button blue-button--dark" to="/surveys">설문 시작하기 <span>→</span></Link><Link className="blue-text-link" to="/signup">처음이라면 회원가입</Link></div>
      </div>
      <div className="blue-hero__art" aria-hidden="true">
        <div className="blue-showcase" data-reveal>
          <span className="blue-showcase__status"><i /> 지금 82명이 참여 중</span>
          <h3 className="blue-showcase__title">캠퍼스 설문<br /><em>네트워크</em></h3>
          <p className="blue-showcase__desc">전국 대학생의 응답이 실시간으로 모여요.<br />개설부터 리워드 정산까지 한 흐름으로 이어집니다.</p>
          <div className="blue-showcase__stats">
            <div><strong>32개</strong><span>참여 대학</span></div>
            <div><strong>4.6분</strong><span>평균 응답 시간</span></div>
            <div><strong>97%</strong><span>리워드 정산율</span></div>
          </div>
        </div>
      </div>
      <a className="blue-scroll" href="#flow">SCROLL <span>↓</span></a>
    </section>

    <section className="blue-flow" id="flow">
      <header data-reveal><p className="blue-eyebrow">ONE SIMPLE FLOW</p><h2>시작부터 결과까지,<br />네 단계면 충분해요.</h2></header>
      <ol>{steps.map((step) => <li key={step.no} data-reveal><div><span>{step.no}</span><small>{step.label}</small></div><h3>{step.title}</h3><p>{step.copy}</p><b aria-hidden="true">↗</b></li>)}</ol>
    </section>

    <section className="blue-surveys" id="surveys">
      <div className="blue-section-copy" data-reveal><p className="blue-eyebrow">SURVEY BOARD</p><h2>참여할 설문을 고르고,<br />내 설문도 바로 만들어요.</h2><p>‘설문 시작하기’를 누르면 현재 모집 중인 설문이 보여요. 참여하고 싶은 설문을 선택하거나 오른쪽 위의 <b>+ 만들기</b>로 새 설문을 개설할 수 있습니다.</p><Link className="blue-button blue-button--dark" to="/surveys">올라온 설문 보기 <span>→</span></Link></div>
      <div className="blue-board" data-reveal>
        <header><div><small>AVAILABLE SURVEYS</small><strong>지금 참여할 수 있는 설문</strong></div><Link to="/surveys/create">+ 만들기</Link></header>
        <div className="blue-board__filters">{filterCategories.map((category) => <button type="button" key={category} className={category === activeCategory ? 'is-active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
        <div className="blue-board__grid">{visibleSurveys.map(([category, title, time, points, percent]) => <article key={title}><div><span>{category}</span><b>{points}</b></div><h3>{title}</h3><p>응답 현황 <strong>{percent}%</strong></p><i><b style={{ width: `${percent}%` }} /></i><footer><span>약 {time}</span><Link to="/surveys">참여하기 →</Link></footer></article>)}{!visibleSurveys.length && <p className="blue-board__empty">해당 카테고리의 설문이 아직 없어요.</p>}</div>
      </div>
    </section>

    <section className="blue-ai" data-reveal>
      <div><p className="blue-eyebrow">AI ASSISTED CREATION</p><h2>목적만 적으면,<br />질문 초안이 시작돼요.</h2><p>AI 추천을 그대로 쓰거나 내 조사에 맞게 수정하세요. 질문 추가와 삭제, 모집 인원과 리워드 설정까지 한 화면에서 이어집니다.</p></div>
      <div className="blue-ai__chat"><header><span>U</span><div><b>Uni AI</b><small>설문 제작 도우미</small></div><i>● ONLINE</i></header><p>대학생의 통학 만족도를 알아보고 싶어요.</p><article><small>추천 질문</small><b>일주일에 평균 며칠 통학하나요?</b><span>주요 교통수단은 무엇인가요?</span><span>통학 시간에 얼마나 만족하나요?</span><button type="button" className={aiApplied ? 'is-applied' : ''} disabled={aiApplied} onClick={() => setAiApplied(true)}>{aiApplied ? '질문에 적용됨 ✓' : '+ 질문으로 적용'}</button></article></div>
    </section>

    <section className="blue-results" id="results">
      <div className="blue-result-panel" data-reveal><header><span>RESULT REPORT</span><b>응답 82건</b></header><h3>통학 만족도 조사</h3><div className="blue-result-stats"><article><span>전체 응답</span><strong>82</strong><small>목표의 82%</small></article><article><span>평균 만족도</span><strong>3.8</strong><small>5점 만점</small></article></div><div className="blue-bars" aria-hidden="true">{[54, 82, 65, 96, 72, 88].map((height, index) => <i key={index} style={{ '--height': `${height}%` }} />)}</div><aside><span>✦ AI 핵심 요약</span><p>응답자는 환승 횟수보다 통학 시간의 예측 가능성을 더 중요하게 느껴요.</p></aside></div>
      <div className="blue-section-copy" data-reveal><p className="blue-eyebrow">RESULTS WITH OWNERSHIP</p><h2>응답이 들어온<br />내 설문만 분석해요.</h2><p>결과 페이지는 <b>본인이 만든 설문</b>에 실제 응답이 한 건 이상 들어온 경우에만 열립니다. 응답 원문은 보호하고, 설문 제작자에게 필요한 통계와 요약만 보여줘요.</p><Link className="blue-button blue-button--dark" to="/dashboard">내 설문 확인하기 <span>→</span></Link></div>
    </section>

    <section className="blue-final" data-reveal><p className="blue-eyebrow">READY WHEN YOU ARE</p><h2>첫 질문을<br />시작해볼까요?</h2><div><Link className="blue-button blue-button--dark" to="/surveys">설문 시작하기 <span>→</span></Link><Link className="blue-button blue-button--light" to="/signup">회원가입</Link></div></section>
    <footer className="blue-footer"><BrandMark light /><p>질문과 사람 사이를 더 가볍게.</p><div><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link><Link to="/surveys">설문 목록</Link><a href="http://www.freepik.com" target="_blank" rel="noreferrer">Designed by Freepik</a></div><small>© 2026 UNI-FORM</small></footer>
  </main>
}
