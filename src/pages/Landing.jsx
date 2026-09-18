import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useReveal } from '../hooks/useReveal'
import '../styles/landing-canva.css'

const journey = [
  ['01', '설문 제작', '목적과 대상에 맞는 질문을 구성합니다.'],
  ['02', '설문 공유', '필요한 응답자에게 설문을 공개합니다.'],
  ['03', '응답 참여', '대학생이 관심 있는 설문에 참여합니다.'],
  ['04', '결과 확인', '모인 응답을 그래프와 데이터로 확인합니다.'],
]

const ranking = [['1', '파란노트', '11회'], ['2', '캠퍼스비', '9회'], ['3', '리플메이트', '8회'], ['4', '새벽도서관', '6회'], ['5', '초록연필', '5회']]

function ProductFrame({ label, children, className = '', ...props }) {
  return <div className={`uf-product-frame ${className}`} {...props}><div className="uf-product-frame__bar"><span>{label}</span><small>화면 미리보기</small></div><div className="uf-product-frame__canvas" inert="" aria-hidden="true">{children}</div></div>
}

function DashboardPreview() {
  const bars = [46, 61, 54, 72, 86, 77, 64]
  return <div className="uf-dashboard-preview"><header><div><small>DASHBOARD</small><h2>대시보드</h2></div><span>최근 7일</span></header><div className="uf-dashboard-metrics"><div><span>진행 중인 설문</span><b>5개</b></div><div><span>누적 응답 수</span><b>312건</b></div><div><span>분석 가능한 설문</span><b>3개</b></div><div><span>이번 주 참여</span><b>12회</b></div></div><div className="uf-dashboard-grid"><section><div className="uf-preview-section-title"><div><b>주간 설문 참여 추이</b><small>최근 7일간 모인 응답입니다.</small></div><span>응답 수</span></div><div className="uf-bar-chart">{bars.map((height, index) => <i key={index} style={{ '--height': `${height}%` }}><b>{[24, 31, 28, 39, 52, 47, 41][index]}</b><span>{index + 7}일</span></i>)}</div></section><aside><div className="uf-preview-section-title"><div><b>최근 활동</b><small>방금 업데이트된 내용입니다.</small></div></div>{['새 응답이 5건 도착했습니다.', '설문 결과를 확인할 수 있습니다.', '목표 응답 수를 달성했습니다.', '새 설문이 등록되었습니다.'].map((item, index) => <p key={item}><span>{item}</span><time>{index + 1}시간 전</time></p>)}</aside></div></div>
}

function FormMatePreview() {
  return <div className="uf-formmate-preview"><section className="uf-formmate-chat"><header><b>FormMate</b><span>문항 초안 도우미</span></header><div className="uf-chat-thread"><p className="is-assistant">어떤 설문을 만들고 싶으신가요?</p><p className="is-user">대학생의 생성형 AI 사용에 대한 설문을 만들고 싶어.</p><p className="is-assistant">좋아요. 먼저 6개의 질문 초안을 만들어볼게요.</p></div><div className="uf-chat-input">원하는 내용을 자유롭게 요청해보세요.<button type="button" aria-label="메시지 보내기">보내기</button></div></section><section className="uf-formmate-editor"><header><div><b>설문 편집</b><span>확인 필요</span></div><button type="button">편집 완료</button></header><label><span>설문 제목</span><input readOnly value="대학생의 생성형 AI 사용 설문" /></label><div className="uf-question-head"><b>문항 구성</b><span>6개 문항</span><i><em /></i><small>1 / 6</small></div>{[['1', '생성형 AI를 얼마나 자주 사용하시나요?', ['거의 사용하지 않음', '주 1~2회', '주 3회 이상']]].map(([number, question, options]) => <article key={number}><header><b>{number}</b><span>객관식 · 필수</span></header><strong>{question}</strong>{options.map((option) => <p key={option}>{option}</p>)}</article>)}</section></div>
}

function LeaderboardPreview() {
  return <div className="uf-leaderboard-preview"><header><div><small>WEEKLY LEADERBOARD</small><h3>이번 주 설문 참여 순위</h3><p>월요일 00:00부터 일요일 23:59까지 · KST</p></div><div><span>이번 주 혜택</span><b>상위 3명 보상</b></div></header><div className="uf-leaderboard-top">{ranking.slice(0, 3).map(([rank, name, score]) => <div key={rank}><small>{rank}위</small><b>{name}</b><strong>{score}</strong></div>)}</div><div className="uf-leaderboard-head"><span>순위</span><span>닉네임</span><span>응답 횟수</span></div>{ranking.slice(3).map(([rank, name, score]) => <div className="uf-rank-row" key={rank}><b>{rank}</b><span>{name}</span><strong>{score}</strong></div>)}<div className="uf-leaderboard-note"><b>이번 주 첫 응답을 해보세요.</b><span>설문 하나에 1점 · 매주 월요일 0시 초기화</span><small>동일한 응답 횟수일 경우 해당 순위는 무작위로 선정됩니다.</small></div></div>
}

function TeamPreview() {
  return <div className="uf-team-preview"><header><div><small>UNIFORM TEAM</small><h3>UniForm 팀</h3></div><span>팀원 4명</span></header><div className="uf-team-members">{['김○○', '이○○', '박○○', '최○○'].map((name) => <span key={name}>{name}</span>)}</div><div className="uf-team-activity"><span>최근 수정</span><b>김○○ · 10분 전</b></div><button type="button">팀원 초대</button></div>
}

function ResultsPreview() {
  const rows = [['매우 만족', 72], ['만족', 64], ['보통', 42], ['불만족', 18]]
  return <div className="uf-results-preview"><header><div><small>RESULT</small><h3>대학생의 AI 서비스 사용 경험 조사</h3></div><span>응답 68건</span></header><div className="uf-result-metrics"><div><span>전체 응답</span><b>68건</b></div><div><span>목표 달성률</span><b>68%</b></div><div><span>응답 완성도</span><b>96%</b></div></div><section><header><div><b>AI 서비스 전반에 얼마나 만족하시나요?</b><small>총 68명이 응답했습니다.</small></div><span>단일 선택</span></header><div>{rows.map(([label, value]) => <p key={label}><span>{label}</span><i><em style={{ width: `${value}%` }} /></i><b>{value}%</b></p>)}</div></section><div className="uf-result-download">그래프 이미지 다운로드 · PNG</div></div>
}

export default function Landing() {
  const rootRef = useReveal([])

  return <main className="uf-landing motion-page" ref={rootRef}>
    <nav className="uf-nav" aria-label="주요 메뉴"><Link className="uf-nav__brand" to="/"><BrandMark /></Link><div className="uf-nav__links"><a href="#leaderboard">리더보드</a><a href="#team">팀</a><a href="#formmate">FormMate</a><a href="#results">결과 확인</a></div><div className="uf-nav__actions"><Link className="uf-nav__login" to="/login">로그인</Link><Link className="uf-button uf-button--primary" to="/signup">무료로 시작하기</Link></div></nav>
    <section className="uf-hero" aria-labelledby="hero-title"><div className="uf-hero__copy"><span className="uf-kicker" data-motion-reveal>UNIFORM</span><h1 id="hero-title" data-motion-reveal style={{ '--delay': '60ms' }}>설문을 올리면,<br />답할 사람이 있습니다</h1><p data-motion-reveal style={{ '--delay': '120ms' }}>대학(원)생이 서로의 설문에 응답하는 곳.<br />설문 제작도 응답자 모집도 비용이 들지 않습니다.</p><div className="uf-hero__actions" data-motion-reveal style={{ '--delay': '180ms' }}><Link className="uf-button uf-button--primary" to="/formmate">무료로 설문 만들기</Link><Link className="uf-button uf-button--secondary" to="/surveys">설문 둘러보기</Link></div></div><ProductFrame label="UniForm 대시보드" className="uf-hero__product" data-motion-reveal style={{ '--delay': '220ms' }}><DashboardPreview /></ProductFrame></section>
    <section className="uf-problem"><div data-motion-reveal><span className="uf-kicker">WHY UNIFORM</span><h2>설문 만들기는 쉬운데,<br />응답자를 찾는 건 어렵습니다.</h2></div><div data-motion-reveal style={{ '--delay': '80ms' }}><p>단톡방 세 곳, 에브리타임, 그리고 친구 부탁.<br />응답 50건을 채우는 데 쓰는 시간입니다.</p><div className="uf-problem-path" aria-label="기존 설문 모집 과정"><span>설문 제작</span><i /><span>링크 공유</span><i /><span>응답 독촉</span><i /><span>결과 재정리</span></div></div></section>
    <section className="uf-process"><header data-motion-reveal><span className="uf-kicker">HOW IT WORKS</span><h2>하나의 흐름으로<br />설문을 완성합니다.</h2></header><ol>{journey.map(([number, title, description], index) => <li key={number} data-motion-reveal style={{ '--delay': `${index * 60}ms` }}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>
    <section className="uf-feature uf-feature--leaderboard" id="leaderboard"><ProductFrame label="UniForm 주간 리더보드" className="uf-feature__product" data-motion-reveal><LeaderboardPreview /></ProductFrame><div className="uf-feature__copy" data-motion-reveal style={{ '--delay': '80ms' }}><span className="uf-kicker">WEEKLY LEADERBOARD</span><h2>응답이 모이는 이유</h2><p>매주 월요일 순위가 새로 시작됩니다.<br /><br />한 주 동안 다른 사람의 설문에 가장 많이 응답한 참여자에게 주간 리더보드 보상을 제공합니다.<br /><br />설문을 올리는 사람은 별도의 모집 비용을 지불하지 않습니다.</p><Link className="uf-text-link" to="/leaderboard">이번 주 순위 확인하기 <span>→</span></Link></div></section>
    <section className="uf-feature uf-feature--team" id="team"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">TEAM</span><h2>조별과제 설문,<br />같이 만드세요</h2><p>최대 6명까지 팀을 만들어 하나의 설문을 함께 작성합니다.<br /><br />누가 언제 무엇을 고쳤는지 기록에 남고, 모인 응답과 결과는 팀원 전원이 함께 봅니다.</p><Link className="uf-text-link" to="/team">팀 만들기 <span>→</span></Link></div><ProductFrame label="UniForm 팀" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><TeamPreview /></ProductFrame></section>
    <section className="uf-feature uf-feature--formmate" id="formmate"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">FORMMATE</span><h2>질문 구성이<br />막막하다면</h2><p>주제와 목적을 말하면 FormMate가 문항 초안을 잡아줍니다.<br /><br />제안된 질문은 직접 고쳐서 바로 설문에 사용할 수 있습니다.</p><Link className="uf-text-link" to="/formmate">FormMate로 초안 만들기 <span>→</span></Link></div><ProductFrame label="FormMate 문항 초안" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><FormMatePreview /></ProductFrame></section>
    <section className="uf-feature uf-feature--results" id="results"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">RESULT</span><h2>응답은 바로<br />그래프가 됩니다</h2><p>응답이 들어오는 대로 문항별 그래프로 확인하세요.<br /><br />발표 자료에 필요한 그래프는 이미지로 내려받을 수 있습니다.</p><Link className="uf-text-link" to="/reports">결과 화면 살펴보기 <span>→</span></Link></div><ProductFrame label="UniForm 문항별 결과" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><ResultsPreview /></ProductFrame></section>
    <section className="uf-final" data-motion-reveal><div><h2>첫 설문,<br />지금 올려보세요</h2><p>회원가입 후 바로 시작할 수 있습니다.<br />목표 인원은 최대 100명까지 설정할 수 있습니다.</p><Link className="uf-button uf-button--primary" to="/signup">무료로 시작하기</Link></div></section>
    <footer className="uf-footer"><BrandMark /><p>대학생을 위한 설문 제작과 참여 플랫폼</p><nav><a href="#leaderboard">리더보드</a><a href="#team">팀</a><a href="#formmate">FormMate</a><Link to="/login">로그인</Link></nav><small>© 2026 UNIFORM</small></footer>
  </main>
}
