import { Link } from 'react-router-dom'

const features = [
  { number: '01', title: '조건에 맞는 응답', text: '연령대, 지역, 관심사를 기준으로 꼭 필요한 사람에게 설문을 보여줍니다.' },
  { number: '02', title: '즉시 지급 포인트', text: '응답이 제출되면 데이터베이스 원장에 기록하고 참여자에게 바로 지급합니다.' },
  { number: '03', title: '한눈에 보는 진행률', text: '목표 응답 수와 남은 예산, 최근 응답 흐름을 대시보드에서 확인합니다.' },
]

export default function Landing() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="주요 메뉴">
        <Link className="brand" to="/" aria-label="UNI-FORM 홈">UNI<span>FORM</span></Link>
        <div className="landing-nav__menu"><a href="#why">서비스 소개</a><a href="#how">이용 방법</a><a href="#for-whom">활용 분야</a></div>
        <div className="landing-nav__actions"><Link className="text-link" to="/login">로그인</Link><Link className="button button--small" to="/signup">무료로 시작하기</Link></div>
      </nav>

      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">OPINIONS INTO VALUE</p>
          <h1>당신의 의견이<br /><em>가치</em>가 되는 곳</h1>
          <p className="hero__description">설문에 참여해 포인트를 얻고, 꼭 필요한 사람들의 솔직한 응답을 더 빠르게 모아보세요.</p>
          <div className="hero__actions"><Link className="button" to="/surveys">설문 참여하기</Link><Link className="button button--ghost" to="/surveys/create">설문 만들기</Link></div>
          <div className="hero__proof" aria-label="서비스 특징"><span><strong>3분</strong> 평균 참여 시간</span><span><strong>실시간</strong> 응답 현황 반영</span><span><strong>100%</strong> 투명한 포인트 원장</span></div>
        </div>
        <div className="hero__visual" aria-label="설문 참여 예시">
          <div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" />
          <div className="survey-preview"><div className="survey-preview__top"><span>오늘의 추천 설문</span><b>+ 320 P</b></div><div className="survey-preview__art"><span>01</span><div className="shape shape--one" /><div className="shape shape--two" /><p>UNI<br />FORM</p></div><h2>더 나은 캠퍼스 라이프에<br />당신의 생각을 더해주세요.</h2><div className="progress-track"><span /></div><div className="survey-preview__meta"><span>82명 참여</span><span>68% 완료</span></div></div>
          <div className="point-toast"><span>참여 완료</span><strong>+ 320 P</strong></div><div className="response-toast"><strong>82</strong><span>responses</span></div>
        </div>
      </section>

      <section className="trust-strip" aria-label="서비스 핵심 지표"><p>의견을 모으는 새로운 기준</p><div><span><strong>12K+</strong> 누적 응답</span><span><strong>4.8/5</strong> 참여 만족도</span><span><strong>24H</strong> 평균 모집 시작</span></div></section>

      <section className="landing-section" id="why">
        <div className="section-heading"><div><p className="eyebrow">WHY UNI-FORM</p><h2>설문이 멈추는 지점을<br />다시 설계했습니다.</h2></div><p>참여자에게는 분명한 보상을, 설문 생성자에게는 원하는 조건의 응답과 투명한 진행 과정을 제공합니다.</p></div>
        <div className="feature-grid">{features.map((feature) => <article key={feature.number}><span>{feature.number}</span><div className={`feature-icon feature-icon--${feature.number}`} aria-hidden="true" /><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
      </section>

      <section className="steps" id="how" aria-labelledby="steps-title"><p className="eyebrow">HOW IT WORKS</p><h2 id="steps-title">의견을 나누는 가장 간단한 방법</h2><div className="steps__grid"><article><span>01</span><h3>프로필 설정</h3><p>관심사와 기본 정보를 설정하면 나에게 맞는 설문을 추천해요.</p></article><article><span>02</span><h3>설문 참여</h3><p>원하는 설문에 답하고 제출 즉시 약속된 포인트를 받아요.</p></article><article><span>03</span><h3>응답 활용</h3><p>직접 설문을 만들고 목표 응답 현황을 한눈에 확인해요.</p></article></div></section>

      <section className="audience-section" id="for-whom">
        <div className="audience-copy"><p className="eyebrow">MADE FOR EVERY QUESTION</p><h2>작은 호기심부터<br />큰 의사결정까지.</h2><p>수업 프로젝트, 신제품 검증, 커뮤니티 의견 수렴까지 응답이 필요한 모든 순간을 UNI-FORM으로 연결하세요.</p><Link className="text-arrow" to="/surveys/create">첫 설문 만들어보기 <span>→</span></Link></div>
        <div className="audience-cards"><article><span>STUDENT</span><h3>과제와 연구를 위한<br />정확한 표본 모집</h3><p>대학생 · 관심 분야 · 지역 조건</p></article><article><span>TEAM</span><h3>제품과 서비스를 위한<br />빠른 사용자 검증</h3><p>잠재 고객 · 사용 경험 · 소비 성향</p></article><article><span>COMMUNITY</span><h3>더 나은 선택을 위한<br />구성원의 목소리</h3><p>지역 · 연령 · 생활 방식 조건</p></article></div>
      </section>

      <section className="landing-cta"><p className="eyebrow">START TODAY</p><h2>좋은 질문에는<br />좋은 응답이 필요하니까.</h2><p>지금 첫 설문에 참여하거나, 필요한 사람들의 의견을 직접 모아보세요.</p><div><Link className="button button--light" to="/signup">무료로 시작하기</Link><Link className="button button--outline-light" to="/surveys">진행 중인 설문 보기</Link></div></section>

      <footer className="landing-footer"><Link className="brand" to="/">UNI<span>FORM</span></Link><p>질문과 사람 사이를 더 가치 있게.</p><div><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link><Link to="/surveys">설문 찾기</Link></div><small>© 2026 UNI-FORM. All rights reserved.</small></footer>
    </main>
  )
}
