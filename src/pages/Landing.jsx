import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import SurveyPainSection from '../components/SurveyPainSection'
import { useReveal } from '../hooks/useReveal'
import '../styles/landing-canva.css'

const leaders = [
  { rank: 1, nickname: '하윤서', score: 11, active: '오늘' },
  { rank: 2, nickname: '박도현', score: 9, active: '오늘' },
  { rank: 3, nickname: '이서진', score: 8, active: '어제' },
  { rank: 4, nickname: '최은우', score: 7, active: '오늘' },
  { rank: 5, nickname: '정하람', score: 6, active: '어제' },
  { rank: 6, nickname: '김도윤', score: 6, active: '2일 전' },
  { rank: 7, nickname: '오지안', score: 5, active: '오늘' },
  { rank: 8, nickname: '윤서준', score: 5, active: '어제' },
  { rank: 9, nickname: '강나은', score: 4, active: '2일 전' },
  { rank: 10, nickname: '조은결', score: 4, active: '3일 전' },
]

function ProductFrame({ label, children, className = '', ...props }) {
  return <div className={`uf-product-frame ${className}`} {...props}><div className="uf-product-frame__bar"><span>{label}</span><small>화면 미리보기</small></div><div className="uf-product-frame__canvas" inert="" aria-hidden="true">{children}</div></div>
}

function FormMatePreview({ compact = false }) {
  return <div className={`uf-formmate-service ${compact ? 'is-compact' : ''}`}>
    <aside className="uf-formmate-service__agent">
      <header><div><h3>FormMate</h3><p>대화로 설문 초안을 만들어보세요.</p></div><i>준비됨</i></header>
      <div className="uf-formmate-service__messages">
        <p className="is-assistant">안녕하세요! 어떤 설문을 만들고 싶으신가요?</p>
        <p className="is-user">대학생의 생성형 AI 사용 경험을 조사하고 싶어.</p>
        <p className="is-assistant">좋아요. 제목과 설명, 질문 유형과 선택지를 포함한 설문 구성을 추천드릴게요.</p>
      </div>
      <div className="uf-formmate-service__composer"><span>원하는 내용을 자유롭게 요청해보세요.</span><b>보내기</b></div>
    </aside>
    <section className="uf-formmate-service__editor">
      <header><div><h3>설문 편집</h3><span>확인 필요</span></div><button type="button">수정하기</button></header>
      <div className="uf-formmate-service__content">
        <label><b>설문 제목</b><span>대학생의 생성형 AI 사용 경험 조사</span></label>
        <label><b>설문 설명</b><span>생성형 AI 사용 빈도와 활용 경험을 알아보는 설문입니다.</span></label>
        <div className="uf-formmate-service__toolbar"><b>문항 구성</b><span>6개 문항</span><i><em /></i><small>1 / 6</small></div>
        <article><header><b>1</b><span>객관식 (단일선택) · 필수</span></header><strong>생성형 AI를 얼마나 자주 사용하시나요?</strong>{['거의 사용하지 않음', '주 1~2회', '주 3회 이상'].map((option) => <p key={option}>{option}</p>)}</article>
      </div>
      <footer><span>자동 저장됨</span><button type="button">설문 등록하기</button></footer>
    </section>
  </div>
}

function LeaderboardPreview() {
  const [first, second, third] = leaders
  return <div className="uf-leaderboard-service">
    <header><div><small>WEEKLY LEADERBOARD</small><h3>응답 횟수 리더보드</h3><p>이번 주 9.14 ~ 9.20 · 매주 월요일 초기화</p></div><span>10명 참여 중</span></header>
    <div className="uf-leaderboard-service__layout">
      <div className="uf-leaderboard-service__main">
        <section className="uf-service-podium"><p>이번 주 가장 활발히 설문에 참여한 유저입니다.</p><div>{[[second, 'silver'], [first, 'gold'], [third, 'bronze']].map(([entry, tier]) => <article className={`is-${tier}`} key={entry.rank}><span>{entry.nickname[0]}</span><b>{entry.nickname}</b><small>{entry.score}회</small><i>{entry.rank}</i></article>)}</div></section>
        <section className="uf-service-ranking"><header><h4>1 ~ 10위 랭킹</h4><span>10명 참여 중</span></header><div className="uf-service-ranking__head"><span>순위</span><span>닉네임</span><span>응답 횟수</span><span>최근 활동일</span></div>{leaders.map((entry) => <div className="uf-service-ranking__row" key={entry.rank}><span>{entry.rank}</span><b>{entry.nickname}</b><strong>{entry.score}회</strong><time>{entry.active}</time></div>)}<nav><button type="button">이전</button><button type="button" className="is-current">1</button><button type="button">다음</button></nav></section>
      </div>
      <aside><h4>보상 안내</h4><p>매주 상위 3명에게 경품을 드립니다.</p>{[['1', '문화상품권 5만원권'], ['2', '문화상품권 3만원권'], ['3', '문화상품권 1만원권']].map(([rank, reward]) => <div key={rank}><span className={`is-rank-${rank}`}>{rank}</span><b>{reward}</b></div>)}</aside>
    </div>
  </div>
}

function TeamPreview() {
  return <div className="uf-team-service">
    <header><div><small>TEAM MANAGEMENT</small><h3>UniForm 팀</h3><p>팀원 4/6명 · 내가 팀장이에요</p></div><button type="button">초대 링크 복사</button></header>
    <section><header><h4>팀원</h4><span>4/6명</span></header>{['김○○', '이○○', '박○○', '최○○'].map((name, index) => <div className="uf-team-service__member" key={name}><b>{name}</b>{index === 0 && <em>팀장</em>}{index === 1 && <i>● 편집 중</i>}</div>)}</section>
    <section><header><h4>팀 초안</h4></header><div className="uf-team-service__draft"><div><b>대학생의 생성형 AI 사용 경험 조사</b><small>마지막 수정 김○○ · 10분 전</small></div><button type="button">이어서 작성</button></div></section>
    <section><header><h4>팀 설문</h4></header><div className="uf-team-service__survey"><div><b>캠퍼스 학습 환경 만족도 조사</b><small>48 / 100명 · 진행 중</small></div><i><em /></i><button type="button">결과 보기</button></div></section>
  </div>
}

export default function Landing() {
  const rootRef = useReveal([])

  return <main className="uf-landing motion-page" ref={rootRef}>
    <nav className="uf-nav" aria-label="주요 메뉴"><Link className="uf-nav__brand" to="/"><BrandMark /></Link><div className="uf-nav__links"><a href="#formmate">FormMate</a><a href="#leaderboard">리더보드</a><a href="#team">팀 관리</a></div><div className="uf-nav__actions"><Link className="uf-nav__signup" to="/signup">회원가입</Link><Link className="uf-button uf-button--primary" to="/login">로그인</Link></div></nav>
    <section className="uf-hero" aria-labelledby="hero-title"><div className="uf-hero__copy"><span className="uf-kicker" data-motion-reveal>UNIFORM</span><h1 id="hero-title" data-motion-reveal style={{ '--delay': '60ms' }}>설문에 재미를 더한<br /><em>AI 폼빌더</em></h1><p data-motion-reveal style={{ '--delay': '120ms' }}>FormMate와 대화해 설문을 만들고,<br />응답이 하나의 활동이 되는 UniForm에서 참여자를 만나보세요.</p><div className="uf-hero__actions" data-motion-reveal style={{ '--delay': '180ms' }}><Link className="uf-button uf-button--primary" to="/formmate">FormMate로 설문 만들기</Link><Link className="uf-button uf-button--secondary" to="/surveys">설문 둘러보기</Link></div></div><ProductFrame label="UniForm 설문 만들기" className="uf-hero__product" data-motion-reveal style={{ '--delay': '160ms' }}><FormMatePreview compact /></ProductFrame></section>
    <SurveyPainSection />
    <section className="uf-feature uf-feature--formmate" id="formmate"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">FORMMATE</span><h2>FormMate와 대화하며<br />설문을 만들어보세요</h2><p>원하는 주제와 목적을 말하면 설문 제목, 설명, 질문 유형과 선택지까지 초안을 제안합니다. 생성된 내용은 직접 확인하고 바로 수정할 수 있습니다.</p><Link className="uf-text-link" to="/formmate">FormMate로 설문 만들기 <span>→</span></Link></div><ProductFrame label="UniForm 설문 만들기" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><FormMatePreview /></ProductFrame></section>
    <section className="uf-feature uf-feature--leaderboard" id="leaderboard"><ProductFrame label="UniForm 리더보드" className="uf-feature__product" data-motion-reveal><LeaderboardPreview /></ProductFrame><div className="uf-feature__copy" data-motion-reveal style={{ '--delay': '80ms' }}><span className="uf-kicker">LEADERBOARD &amp; REWARD</span><h2>응답에<br />재미를 더하다</h2><p>설문에 답할수록 참여 기록이 쌓이고, 리더보드에서 나의 순위를 확인할 수 있어요. 참여의 재미를 따라가다 보면 어느새 누군가의 설문에도 힘이 됩니다.</p><div className="uf-reward-summary"><b>매주 TOP 3</b><span>5만원 · 3만원 · 1만원 문화상품권</span></div><Link className="uf-text-link" to="/leaderboard">이번 주 순위 확인하기 <span>→</span></Link></div></section>
    <section className="uf-feature uf-feature--team" id="team"><div className="uf-feature__copy" data-motion-reveal><span className="uf-kicker">TEAM</span><h2>팀플 설문도,<br />팀원들과 함께 관리하세요</h2><p>최대 6명이 하나의 설문을 함께 만들고 수정 기록과 응답 현황을 공유합니다. 초안부터 결과 확인까지 팀 단위로 이어집니다.</p><Link className="uf-text-link" to="/team">팀 관리 시작하기 <span>→</span></Link></div><ProductFrame label="UniForm 팀 관리" className="uf-feature__product" data-motion-reveal style={{ '--delay': '80ms' }}><TeamPreview /></ProductFrame></section>
    <section className="uf-final" data-motion-reveal><div><h2>설문에 새로운 경험을<br />더해보세요</h2><p>FormMate로 만들고, 응답이 활동이 되는 UniForm에서 시작하세요.</p><Link className="uf-button uf-button--primary" to="/login">시작하기</Link></div></section>
    <footer className="uf-footer"><BrandMark /><p>대학생을 위한 설문 제작과 참여 플랫폼</p><nav><Link to="/support">고객센터</Link></nav><small>© 2026 UNIFORM</small></footer>
  </main>
}
