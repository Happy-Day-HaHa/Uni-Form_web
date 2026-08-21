import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="주요 메뉴"><Link className="brand" to="/">UNI<span>FORM</span></Link><div className="landing-nav__actions"><Link className="text-link" to="/login">로그인</Link><Link className="button button--small" to="/signup">무료로 시작하기</Link></div></nav>
      <section className="hero">
        <div className="hero__copy"><p className="eyebrow">OPINIONS INTO VALUE</p><h1>당신의 의견이<br /><em>가치</em>가 되는 곳</h1><p className="hero__description">설문에 참여해 포인트를 얻고, 꼭 필요한 사람들의 응답을 더 빠르게 모아보세요.</p><div className="hero__actions"><Link className="button" to="/surveys">설문 참여하기</Link><Link className="button button--ghost" to="/surveys/create">설문 만들기</Link></div><div className="hero__proof" aria-label="서비스 특징"><span><strong>3분</strong> 평균 참여 시간</span><span><strong>100%</strong> 투명한 포인트 원장</span></div></div>
        <div className="hero__visual" aria-label="설문 참여 예시"><div className="survey-preview"><div className="survey-preview__top"><span>오늘의 추천 설문</span><b>+ 320 P</b></div><div className="survey-preview__art"><span>01</span><div className="shape shape--one" /><div className="shape shape--two" /></div><h2>새로운 캠퍼스 라이프에<br />당신의 생각을 더해주세요.</h2><div className="progress-track"><span /></div><div className="survey-preview__meta"><span>약 4분</span><span>마감까지 2일</span></div></div><div className="point-toast"><span>참여 완료</span><strong>+ 320 P</strong></div></div>
      </section>
      <section className="steps" aria-labelledby="steps-title"><p className="eyebrow">HOW IT WORKS</p><h2 id="steps-title">의견을 나누는 가장 간단한 방법</h2><div className="steps__grid"><article><span>01</span><h3>프로필 설정</h3><p>관심사와 기본 정보를 설정하면 나에게 맞는 설문을 추천해요.</p></article><article><span>02</span><h3>설문 참여</h3><p>원하는 설문에 답하고 제출 즉시 포인트를 받아요.</p></article><article><span>03</span><h3>응답 활용</h3><p>직접 설문을 만들고 목표 응답 현황을 한눈에 확인해요.</p></article></div></section>
    </main>
  )
}
