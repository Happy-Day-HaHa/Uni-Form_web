import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useReveal } from '../hooks/useReveal'
import { demoSurveys } from '../services/surveyService'
import '../styles/landing-canva.css'

const journey = [
  ['01', '설문 제작', '목적과 대상에 맞는 질문을 구성합니다.'],
  ['02', '설문 공유', '필요한 응답자에게 설문을 공개합니다.'],
  ['03', '응답 참여', '대학생이 관심 있는 설문에 참여합니다.'],
  ['04', '결과 확인', '모인 응답을 그래프와 데이터로 확인합니다.'],
]

const ranking = [['1', '민서', '28회'], ['2', '지훈', '24회'], ['3', '서연', '21회'], ['4', '현우', '18회'], ['5', '유진', '16회']]

function ProductFrame({ label, children, className = '', ...props }) {
  return <div className={`uf-product-frame ${className}`} {...props}><div className="uf-product-frame__bar"><span>{label}</span><small>화면 미리보기</small></div><div className="uf-product-frame__canvas" inert="" aria-hidden="true">{children}</div></div>
}

function DashboardPreview() {
  const bars = [46, 61, 54, 72, 86, 77, 64]
  return <div className="uf-dashboard-preview"><header><div><small>DASHBOARD</small><h2>대시보드</h2></div><span>최근 7일</span></header><div className="uf-dashboard-metrics"><div><span>진행 중인 설문</span><b>5개</b></div><div><span>누적 응답 수</span><b>824건</b></div><div><span>분석 가능한 설문</span><b>3개</b></div><div><span>이번 주 참여</span><b>12회</b></div></div><div className="uf-dashboard-grid"><section><div className="uf-preview-section-title"><div><b>주간 설문 참여 추이</b><small>최근 7일간 모인 응답입니다.</small></div><span>응답 수</span></div><div className="uf-bar-chart">{bars.map((height, index) => <i key={index} style={{ '--height': `${height}%` }}><b>{[72, 98, 88, 112, 162, 148, 121][index]}</b><span>{index + 7}일</span></i>)}</div></section><aside><div className="uf-preview-section-title"><div><b>최근 활동</b><small>방금 업데이트된 내용입니다.</small></div></div>{['새 응답이 5건 도착했습니다.', '설문 분석이 준비되었습니다.', '목표 응답 수를 달성했습니다.', '새 설문이 등록되었습니다.'].map((item, index) => <p key={item}><span>{item}</span><time>{index + 1}시간 전</time></p>)}</aside></div></div>
}

function FormMatePreview() {
  return <div className="uf-formmate-preview"><section className="uf-formmate-chat"><header><b>FormMate</b><span>AI 설문 도우미</span></header><div className="uf-chat-thread"><p className="is-assistant">어떤 설문을 만들고 싶으신가요?</p><p className="is-user">대학생의 시간 관리 방법에 대한 설문을 만들어줘. 8문항 정도면 좋겠어.</p><p className="is-assistant">목적에 맞게 문항을 구성했어요. 오른쪽에서 질문과 선택지를 바로 수정할 수 있습니다.</p></div><div className="uf-chat-input">원하는 내용을 자유롭게 요청해보세요.<button type="button" aria-label="메시지 보내기">보내기</button></div></section><section className="uf-formmate-editor"><header><div><b>설문 편집</b><span>편집 모드</span></div><button type="button">편집 완료</button></header><label><span>설문 제목</span><input readOnly value="대학생의 시간 관리 방법에 대한 설문" /></label><div className="uf-question-head"><b>문항 구성</b><span>8개 문항</span><i><em /></i><small>2 / 8</small></div>{[['1', '현재 학년을 선택해주세요.', ['1학년', '2학년', '3학년', '4학년']], ['2', '하루 평균 학습에 투자하는 시간은 얼마인가요?', ['1시간 미만', '1~3시간', '3~5시간']]].map(([number, question, options]) => <article key={number}><header><b>{number}</b><span>객관식 · 필수</span></header><strong>{question}</strong>{options.map((option) => <p key={option}>{option}</p>)}</article>)}</section></div>
}

function SurveyListPreview({ surveys }) {
  return <div className="uf-survey-preview"><header><div><small>SURVEY DISCOVERY</small><h3>지금 참여할 수 있는 설문</h3></div><span>{surveys.length}개 설문</span></header><div className="uf-survey-search"><input readOnly placeholder="설문 제목이나 키워드로 검색해보세요." /><button type="button">최신순</button></div><div className="uf-survey-rows">{surveys.slice(0, 4).map((survey) => { const progress = Math.min(100, Math.round((survey.response_count / survey.target_count) * 100)); return <article key={survey.id}><div><small>{survey.category}</small><b>{survey.title}</b><p>{survey.description}</p><span>약 {survey.estimated_minutes || 5}분 · {survey.response_count.toLocaleString()}명 참여 중</span></div><div><span>모집 현황 {progress}%</span><i><em style={{ width: `${progress}%` }} /></i></div><span className="uf-preview-button">참여하기</span></article> })}</div></div>
}

function LeaderboardPreview() {
  return <div className="uf-leaderboard-preview"><header><div><small>MONTHLY LEADERBOARD</small><h3>9월 설문 참여 순위</h3><p>설문 참여 횟수를 기준으로 집계됩니다.</p></div><div><span>이번 달 혜택</span><b>상위 3명 상품 제공</b></div></header><div className="uf-leaderboard-head"><span>순위</span><span>닉네임</span><span>응답 횟수</span></div>{ranking.map(([rank, name, score]) => <div className={`uf-rank-row uf-rank-row--${rank}`} key={rank}><b>{rank}</b><span>{name}</span><strong>{score}</strong></div>)}</div>
}

function ResultsPreview() {
  const rows = [['매우 만족', 72], ['만족', 64], ['보통', 42], ['불만족', 18]]
  return <div className="uf-results-preview"><header><div><small>RESULT REPORT</small><h3>대학생의 AI 서비스 사용 경험 조사</h3></div><span>응답 341건</span></header><div className="uf-result-metrics"><div><span>전체 응답</span><b>341건</b></div><div><span>목표 달성률</span><b>57%</b></div><div><span>응답 완성도</span><b>96%</b></div></div><section><header><div><b>AI 서비스 전반에 얼마나 만족하시나요?</b><small>총 341명이 응답했습니다.</small></div><span>단일 선택</span></header><div>{rows.map(([label, value]) => <p key={label}><span>{label}</span><i><em style={{ width: `${value}%` }} /></i><b>{value}%</b></p>)}</div></section></div>
}

export default function Landing() {
  const rootRef = useReveal([])

  return <main className="uf-landing motion-page" ref={rootRef}>
    <nav className="uf-nav" aria-label="주요 메뉴"><Link className="uf-nav__brand" to="/"><BrandMark /></Link><div className="uf-nav__links"><a href="#formmate">FormMate</a><a href="#surveys">설문 찾기</a><a href="#leaderboard">리더보드</a><a href="#results">결과 확인</a></div><div className="uf-nav__actions"><Link className="uf-nav__login" to="/login">로그인</Link><Link className="uf-button uf-button--primary" to="/signup">무료로 시작하기</Link></div></nav>
    <section className="uf-hero" aria-labelledby="hero-title"><div className="uf-hero__copy"><span className="uf-kicker" data-motion-reveal>UNIFORM</span><h1 id="hero-title" data-motion-reveal style={{ '--delay': '60ms' }}>설문은 간단하게,<br />결과는 선명하게.</h1><p data-motion-reveal style={{ '--delay': '120ms' }}>설문 제작부터 응답 모집, 결과 확인까지<br />대학생의 설문 과정을 하나의 공간에서 해결하세요.</p><div className="uf-hero__actions" data-motion-reveal style={{ '--delay': '180ms' }}><Link className="uf-button uf-button--primary" to="/formmate">무료로 설문 만들기</Link><Link className="uf-button uf-button--secondary" to="/surveys">설문 둘러보기</Link></div></div><ProductFrame label="UniForm 대시보드" className="uf-hero__product" data-motion-reveal style={{ '--delay': '220ms' }}><DashboardPreview /></ProductFrame></section>
    <section className="uf-problem"><div data-motion-reveal><span className="uf-kicker">WHY UNIFORM</span><h2>설문 만들기는 쉬운데,<br />응답자를 찾는 건 어렵습니다.</h2></div><div data-motion-reveal style={{ '--delay': '80ms' }}><p>과제, 연구, 프로젝트를 위해 설문을 만들지만 응답자를 모집하기 위해 여러 단체 채팅방과 커뮤니티를 돌아다녀야 합니다.</p><div className="uf-problem-path"><span>설문 제작</span><i /><span>링크 공유</span><i /><span>응답 독촉</span><i /><span>결과 재정리</span></div></div></section>
    <section className="uf-process"><header data-motion-reveal><span className="uf-kicker">HOW IT WORKS</span><h2>하나의 흐름으로<br />설문을 완성합니다.</h2></header><ol>{journey.map(([number, title, description], index) => <li key={number} data-motion-reveal style={{ '--delay': `${index * 60}ms` }}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>
    <section className="uf-feature uf-feature--formmate" id="formmate"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">FORMMATE</span><h2>막막한 설문도,<br />대화하듯 간단하게.</h2><p>원하는 설문 주제와 목적을 입력하면 FormMate가 질문 구성부터 문항 작성까지 도와줍니다. 제안된 초안은 직접 수정하고 바로 게시할 수 있습니다.</p><Link className="uf-text-link" to="/formmate">FormMate로 설문 만들기 <span>→</span></Link></div><ProductFrame label="FormMate 설문 편집" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><FormMatePreview /></ProductFrame></section>
    <section className="uf-product-section" id="surveys"><header data-motion-reveal><div><span className="uf-kicker">SURVEY DISCOVERY</span><h2>필요한 설문을 찾고,<br />바로 참여하세요.</h2></div><p>UniForm에 등록된 최신 설문을 한곳에서 확인하고 원하는 설문에 바로 참여할 수 있습니다.</p></header><ProductFrame label="UniForm 설문 목록" data-motion-reveal><SurveyListPreview surveys={demoSurveys} /></ProductFrame></section>
    <section className="uf-feature uf-feature--leaderboard" id="leaderboard"><ProductFrame label="UniForm 리더보드" className="uf-feature__product" data-motion-reveal><LeaderboardPreview /></ProductFrame><div className="uf-feature__copy" data-motion-reveal style={{ '--delay': '80ms' }}><span className="uf-kicker">LEADERBOARD</span><h2>참여할수록,<br />더 많은 혜택을.</h2><p>매달 설문 응답 횟수를 기준으로 리더보드를 운영하고 상위 3명에게 상품을 제공합니다. 순위는 실제 참여 기록으로 투명하게 집계됩니다.</p><Link className="uf-text-link" to="/leaderboard">이번 달 순위 확인하기 <span>→</span></Link></div></section>
    <section className="uf-feature uf-feature--results" id="results"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">RESULT REPORT</span><h2>모인 응답은,<br />한눈에 정리됩니다.</h2><p>응답 현황과 설문 결과를 직관적인 그래프와 데이터로 확인할 수 있습니다. 별도의 표 정리 없이 바로 결과를 읽고 공유하세요.</p><Link className="uf-text-link" to="/reports">결과 화면 살펴보기 <span>→</span></Link></div><ProductFrame label="UniForm 결과 보고서" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><ResultsPreview /></ProductFrame></section>
    <section className="uf-final" data-motion-reveal><div><h2>지금 첫 설문을 만들어보세요.</h2><p>설문 제작부터 응답 모집까지 UniForm에서 시작할 수 있습니다.</p><Link className="uf-button uf-button--primary" to="/formmate">무료로 시작하기</Link></div></section>
    <footer className="uf-footer"><BrandMark /><p>대학생을 위한 설문 제작과 참여 플랫폼</p><nav><a href="#formmate">FormMate</a><a href="#surveys">설문 찾기</a><a href="#leaderboard">리더보드</a><Link to="/login">로그인</Link></nav><small>© 2026 UNIFORM</small></footer>
  </main>
}
