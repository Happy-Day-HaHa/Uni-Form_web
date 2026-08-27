import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import '../styles/landing.css'
import '../styles/landing-sections.css'
import '../styles/dandy.css'

const journey = [
  { number: '01', label: 'VERIFY', title: '학생으로 시작해요', description: '대학 이메일로 인증하고, 믿을 수 있는 설문 네트워크에 들어와요.', steps: ['회원가입', '대학 이메일 인증', '로그인'], tone: 'peach' },
  { number: '02', label: 'ANSWER & EARN', title: '답하고 포인트를 모아요', description: '내 조건에 맞는 설문과 보상을 먼저 확인하고 편하게 참여해요.', steps: ['참여 가능한 설문 조회', '보상 포인트 확인', '설문 참여', '포인트 획득'], tone: 'blue' },
  { number: '03', label: 'ASK & DISCOVER', title: '필요한 답을 모아요', description: '모은 포인트로 설문을 열고, 응답 현황과 결과를 한눈에 확인해요.', steps: ['내 설문 등록', '인원 × 보상 포인트 사용', '다른 사용자 참여', '응답 결과 확인'], tone: 'lime' },
]

const features = [
  ['01', '대학생 인증', '대학 이메일 인증을 거친 응답자와 만나 결과의 신뢰도를 높여요.'],
  ['02', '조건 매칭', '학년·전공 등 모집 조건에 맞는 학생에게 설문을 보여줘요.'],
  ['03', '상호 참여 포인트', '응답으로 얻은 포인트가 다음 설문의 모집비가 되어 다시 순환해요.'],
  ['04', '결과 대시보드', '모집 진행률과 응답 결과를 한 화면에서 직관적으로 확인해요.'],
]

export default function Landing() {
  return (
    <main className="unf-landing">
      <nav className="unf-nav" aria-label="주요 메뉴">
        <BrandMark className="unf-brand" light />
        <div className="unf-nav__links"><a href="#journey">서비스 흐름</a><a href="#points">포인트</a><a href="#results">결과 확인</a></div>
        <div className="unf-nav__actions"><Link to="/login">로그인</Link><Link to="/signup">학생 인증하기 <span aria-hidden="true">↗</span></Link></div>
      </nav>

      <section className="unf-hero" aria-labelledby="unf-hero-title">
        <div className="unf-hero__cloud unf-hero__cloud--one" aria-hidden="true" /><div className="unf-hero__cloud unf-hero__cloud--two" aria-hidden="true" />
        <div className="unf-hero__copy">
          <p className="unf-eyebrow"><span /> UNIVERSITY SURVEY NETWORK</p>
          <h1 id="unf-hero-title"><span>필요한 응답은 <em>더 빠르게,</em></span><span>참여한 시간은 <em>포인트로.</em></span></h1>
          <p className="unf-hero__description">단톡방에 매번 부탁하지 않아도 괜찮아요.<br />인증된 대학생의 질문과 답이 자연스럽게 이어지는 곳, UNI-FORM.</p>
          <Link className="unf-primary-cta" to="/signup">대학 인증하고 시작하기 <span aria-hidden="true">→</span></Link>
        </div>

        <div className="unf-hero-stage" aria-label="UNI-FORM 설문 참여 예시">
          <p className="unf-stage-word" aria-hidden="true">ASK<br />&amp; EARN</p>
          <div className="unf-orbit unf-orbit--one" aria-hidden="true" /><div className="unf-orbit unf-orbit--two" aria-hidden="true" />
          <div className="unf-survey-card"><div className="unf-survey-card__top"><span>추천 설문</span><b>+300 P</b></div><div className="unf-survey-card__art"><span>UNI</span><i>FORM</i></div><p>대학생의 디지털 서비스 이용 경험</p><div className="unf-progress"><span /></div><small>82명이 참여했어요 · 약 3분</small></div>
          <div className="unf-glass-pill"><span className="unf-glass-pill__dot" /><span>참여 가능</span><strong>+300 P</strong><i aria-hidden="true">→</i></div>
          <div className="unf-paper-plane" aria-hidden="true"><span /></div><div className="unf-sticker" aria-hidden="true">100<br /><span>RESPONSES</span></div>
        </div>
        <p className="unf-scroll">SCROLL TO SEE THE FLOW <span>↓</span></p>
      </section>

      <section className="unf-problem" aria-label="설문 응답 모집 문제">
        <p>“설문조사 한 번만 부탁해!”</p>
        <div className="unf-problem__numbers"><span><small>지금 모인 응답</small><strong>3</strong></span><i aria-hidden="true">→</i><span><small>UNI-FORM 목표</small><strong>100</strong></span></div>
        <p>부탁을 반복하는 대신, 조건에 맞는 학생과 연결하세요.</p>
      </section>

      <section className="unf-journey" id="journey" aria-labelledby="unf-journey-title">
        <header className="unf-section-heading"><p>ONE CONNECTED JOURNEY</p><h2 id="unf-journey-title">가입부터 결과까지,<br /><em>한 흐름이면 충분해요.</em></h2><p>사용자 여정을 세 단계로 정리했습니다. 찾고, 답하고, 모으는 모든 과정이 끊기지 않아요.</p></header>
        <ol className="unf-journey-grid">
          {journey.map((chapter) => (
            <li className={`unf-journey-card unf-journey-card--${chapter.tone}`} key={chapter.number}>
              <div className="unf-journey-card__head"><span>{chapter.number}</span><small>{chapter.label}</small></div><h3>{chapter.title}</h3><p>{chapter.description}</p>
              <ol>{chapter.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol>
            </li>
          ))}
        </ol>
      </section>

      <section className="unf-points" id="points" aria-labelledby="unf-points-title">
        <div className="unf-points__copy"><p className="unf-eyebrow"><span /> MUTUAL POINT ECONOMY</p><h2 id="unf-points-title">내 답변이<br />다음 질문의<br /><em>시작점.</em></h2><p>설문에 참여해 포인트를 얻고, 모은 포인트로 내 설문의 응답자를 모집해요. 참여가 다시 참여를 만드는 구조입니다.</p></div>
        <div className="unf-point-loop" aria-label="UNI-FORM 포인트 사용 예시">
          <div className="unf-point-loop__card unf-point-loop__card--answer"><span>ANSWER</span><h3>설문에 답하기</h3><strong>+ 200 P</strong><p>응답 완료 즉시 적립</p></div><div className="unf-point-loop__arrow" aria-hidden="true">↘</div>
          <div className="unf-budget"><span>모집 포인트 계산</span><div><strong>100</strong><small>명</small><i>×</i><strong>200</strong><small>P</small></div><p>필요 포인트 <b>20,000 P</b></p></div><div className="unf-point-loop__arrow unf-point-loop__arrow--return" aria-hidden="true">↖</div>
          <div className="unf-point-loop__card unf-point-loop__card--ask"><span>ASK</span><h3>내 설문 열기</h3><strong>− 20,000 P</strong><p>인원 × 1인 보상만큼 사용</p></div>
        </div>
      </section>

      <section className="unf-results" id="results" aria-labelledby="unf-results-title">
        <div className="unf-results__board"><div className="unf-board__nav"><span>MY SURVEY</span><i /><i /><i /></div><div className="unf-board__summary"><div><small>응답 현황</small><strong>82<em>/100</em></strong></div><div className="unf-ring" style={{ position: 'relative' }}><span>82%</span></div></div><div className="unf-board__chart" aria-hidden="true"><span style={{ '--bar': '42%' }} /><span style={{ '--bar': '65%' }} /><span style={{ '--bar': '54%' }} /><span style={{ '--bar': '82%' }} /><span style={{ '--bar': '74%' }} /><span style={{ '--bar': '91%' }} /></div><div className="unf-board__meta"><span>평균 응답 시간 <b>03:24</b></span><span>완료율 <b>94%</b></span></div></div>
        <div className="unf-results__copy"><p>RESULTS, NOT RAW NUMBERS</p><h2 id="unf-results-title">모인 답을<br /><em>한눈에.</em></h2><p>모집 진행률부터 응답 현황, 결과까지 대시보드에서 바로 확인하세요. 필요한 순간에 다음 판단으로 이어질 수 있도록.</p><div className="unf-feature-list">{features.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></div>
      </section>

      <section className="unf-final-cta" aria-labelledby="unf-final-title"><p>YOUR OPINION HAS VALUE</p><h2 id="unf-final-title">첫 답변부터<br />시작해볼까요?</h2><Link to="/signup" aria-label="UNI-FORM 회원가입으로 이동">학생 인증하고 시작하기 <span>↗</span></Link><div className="unf-final-shapes" aria-hidden="true"><i /><i /><i /><i /></div></section>

      <footer className="unf-footer"><BrandMark light /><p>질문과 사람 사이를 더 가치 있게.</p><div><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link><Link to="/dashboard">대시보드</Link><Link to="/versions">버전 기록</Link></div><small>© 2026 UNI-FORM · UNIVERSITY SURVEY NETWORK</small></footer>
    </main>
  )
}
