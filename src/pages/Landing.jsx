import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import Folder from '../components/Folder'
import MaskedHeading from '../components/MaskedHeading'
import ParticleText from '../components/ParticleText'
import '../styles/landing.css'

const flow = [
  { no: '01', eyebrow: 'JOIN', title: '나답게 가입하기', copy: '이름과 이메일은 기본. 직업, 나이, 생년월일, 관심 분야까지 차근차근 물어봐요.', chips: ['기본 정보', '상세 프로필', '관심 분야'], tone: 'peach' },
  { no: '02', eyebrow: 'DISCOVER', title: '내게 맞는 설문 발견', copy: '로그인하면 다른 사용자가 올린 설문을 한눈에 보고, 조건과 보상을 확인해 바로 참여해요.', chips: ['맞춤 설문', '예상 시간', '참여 가능 여부'], tone: 'yellow' },
  { no: '03', eyebrow: 'CREATE', title: 'AI와 함께 설문 제작', copy: '직접 만들다가 막히면 Uni-Chat에게 물어보세요. 추천한 질문을 클릭 한 번으로 반영할 수 있어요.', chips: ['질문 추천', '표현 개선', '설문에 반영'], tone: 'blue' },
  { no: '04', eyebrow: 'ANALYZE', title: '응답을 인사이트로', copy: '문항별 그래프부터 응답자 특성, 주관식 요약까지 모아 바로 공유할 수 있는 리포트로 만들어요.', chips: ['자동 집계', 'AI 요약', '파일 저장'], tone: 'mint' },
]

const features = [
  ['01', 'AI 설문 자동 분석', '응답이 들어오는 즉시 통계·그래프·요약을 만들어요.', '3시간 → 15분'],
  ['02', '리마인드 자동 발송', '아직 응답하지 않은 사람에게만 가볍게 다시 알려요.', '응답률 1.8×'],
  ['03', 'Uni-Chat 공동 제작', '목적만 말하면 질문, 보기, 순서, 표현을 함께 다듬어요.', '평균 10분'],
]

export default function Landing() {
  const [chatApplied, setChatApplied] = useState(false)
  const [isHolding, setIsHolding] = useState(false)

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.14 }
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <main className={`uf26 ${isHolding ? 'is-holding' : ''}`}>
      <nav className="uf26-nav" aria-label="주요 메뉴">
        <BrandMark className="uf26-brand" />
        <div className="uf26-nav__links"><a href="#how">이용 방법</a><a href="#create">Uni-Chat</a><a href="#result">결과 분석</a></div>
        <div className="uf26-nav__actions"><Link to="/login">로그인</Link><Link to="/signup">무료로 시작하기 <span>↗</span></Link></div>
      </nav>

      <section className="uf26-hero" aria-labelledby="hero-title">
        <div className="uf26-hero__copy" data-reveal>
          <p className="uf26-kicker">AI SURVEY WORKSPACE</p>
          <h1 id="hero-title">설문 제작부터<br />분석까지, <em>15분이면</em><br />충분해요.</h1>
        </div>
        <div className="uf26-hero__visual" aria-hidden="true">
          <div className="uf26-ribbon uf26-ribbon--one" /><div className="uf26-ribbon uf26-ribbon--two" /><div className="uf26-ribbon uf26-ribbon--three" /><div className="uf26-ribbon uf26-ribbon--four" />
        </div>
        <button className="uf26-hold" type="button" aria-label="애니메이션 활성화" onPointerDown={() => setIsHolding(true)} onPointerUp={() => setIsHolding(false)} onPointerLeave={() => setIsHolding(false)}><span><i /><i /></span><b>{isHolding ? 'KEEP HOLDING' : 'CLICK AND HOLD'}</b></button>
        <div className="uf26-hero__side" data-reveal><p>설문 만들기부터 AI 분석, 챗봇 연동까지.<br />대학생이 직접 써보고 만든 자동화 툴이에요.</p><div><Link to="/signup">지금 시작하기</Link><a href="#create">Uni-Chat 보기</a></div></div>
      </section>

      <section className="uf26-marquee" aria-label="Uni-Form 주요 기능"><div>AI 설문 제작 <i>✦</i> 자동 결과 분석 <i>✦</i> 맞춤 설문 추천 <i>✦</i> 리마인드 자동화 <i>✦</i> AI 설문 제작 <i>✦</i> 자동 결과 분석</div></section>

      <section className="uf26-problem" id="problem"><div className="uf26-section-label" data-reveal><span>01</span><p>THE OLD WAY</p></div><div className="uf26-problem__headline" data-reveal><h2>설문 하나 돌리는데,<br /><em>왜 이렇게 할 일이 많죠?</em></h2><p>만드는 사람도, 답하는 사람도<br />조금 덜 지치게 만들었어요.</p></div><div className="uf26-problem__cards"><article data-reveal><span>01</span><b>3H</b><h3>응답 정리에만 3시간</h3><p>엑셀로 옮기고, 필터 걸고, 그래프 만들다 보면 심사 전날이 와요.</p></article><article data-reveal><span>02</span><b>12%</b><h3>링크만 뿌리면 낮은 응답률</h3><p>리마인드를 따로 보내지 않으면 응답은 금세 멈춰버려요.</p></article><article data-reveal><span>03</span><b>AGAIN</b><h3>매 학기 처음부터 다시</h3><p>반복되는 설문인데 데이터도, 질문도 계속 흩어져 있어요.</p></article></div></section>

      <section className="uf26-archive" data-reveal>
        <div className="uf26-archive__copy"><p>ALL YOUR SURVEYS, ONE PLACE</p><h2>흩어진 설문은 이제,<br /><em>폴더 하나로.</em></h2><p>만든 설문, 받은 응답, AI 요약까지. 클릭 한 번이면 열려요.</p></div>
        <Folder color="#ff3d94" size={1.8} className="uf26-archive__folder" items={[<span key="a">설문 초안</span>, <span key="b">응답 128건</span>, <span key="c">AI 요약</span>]} />
      </section>

      <section className="uf26-flow" id="how"><header data-reveal><p>ONE CONNECTED JOURNEY</p><MaskedHeading tag="h2" text="가입부터 결과까지, 한 흐름이면 충분해요." src="/og-v6.png" fillScale={1.2} parallax={22} reveal="wipe" trigger="view" duration={1.3} textScale={0.08} weight={860} tracking={-0.03} lineHeight={0.98} /></header><ol>{flow.map((item) => <li className={`uf26-flow__item ${item.tone}`} key={item.no} data-reveal><div className="uf26-flow__top"><span>{item.no}</span><small>{item.eyebrow}</small></div><div><h3>{item.title}</h3><p>{item.copy}</p><div className="uf26-chips">{item.chips.map((chip) => <span key={chip}>{chip}</span>)}</div></div><b aria-hidden="true">↘</b></li>)}</ol></section>

      <section className="uf26-create" id="create"><div className="uf26-create__copy" data-reveal><p>MEET YOUR SURVEY MATE</p><h2>혼자 만들지 말고,<br /><em>Uni-Chat과 같이.</em></h2><p>직접 문항을 만들다가 막히는 순간, 오른쪽 채팅창에 목적을 말해보세요. Claude 기반 Uni-Chat이 질문과 보기, 순서와 표현을 계속 제안합니다.</p><ul><li><span>01</span> 사용 목적과 타깃 입력</li><li><span>02</span> 질문·보기·순서 추천</li><li><span>03</span> 클릭 한 번으로 설문에 반영</li></ul></div><div className="uf26-builder" data-reveal><div className="uf26-builder__top"><div><span /><span /><span /></div><b>새 설문 만들기</b><button type="button">미리보기</button></div><div className="uf26-builder__body"><div className="uf26-editor"><small>SURVEY EDITOR</small><input aria-label="설문 제목" value={chatApplied ? '대학생의 카페 이용과 공간 선호도' : '대학생 카페 이용 조사'} readOnly /><p>더 좋은 캠퍼스 주변 공간을 찾기 위한 설문이에요.</p><article><span>01 · 객관식</span><h4>일주일에 카페를 몇 번 이용하나요?</h4><div><i /> 0–1회</div><div><i /> 2–3회</div><div><i /> 4회 이상</div></article><article className={chatApplied ? 'is-applied' : ''}><span>02 · 객관식 {chatApplied && <b>AI 반영됨</b>}</span><h4>{chatApplied ? '카페를 선택할 때 가장 중요하게 보는 것은 무엇인가요?' : '카페 선택 기준은 무엇인가요?'}</h4><div><i /> 가격</div><div><i /> 거리</div><div><i /> 분위기와 좌석</div></article></div><aside className="uf26-chat"><header><div className="uf26-chat__bot">U</div><div><b>Uni-Chat</b><span><i /> Online · Claude API</span></div><button type="button">•••</button></header><div className="uf26-chat__messages"><p className="from-user">대학생들이 카페를 고르는 기준을 알아보고 싶어.</p><div className="from-bot"><b>Uni-Chat</b><p>좋아요! 선택 기준을 비교하기 쉽도록 질문을 조금 더 구체적으로 바꿔볼게요.</p><div className="uf26-suggestion"><span>추천 문항</span><strong>카페를 선택할 때 가장 중요하게 보는 것은 무엇인가요?</strong><small>가격 · 거리 · 분위기와 좌석 · 메뉴 다양성</small></div><button type="button" onClick={() => setChatApplied(true)} disabled={chatApplied}>{chatApplied ? '✓ 설문에 반영했어요' : '＋ 설문에 반영'}</button></div></div><div className="uf26-chat__input"><span>질문을 입력해 주세요</span><button type="button">↑</button></div></aside></div></div></section>

      <section className="uf26-results" id="result"><div className="uf26-results__header" data-reveal><p>RESULTS, NOT RAW NUMBERS</p><h2>응답이 모이면,<br /><em>결론까지 보여드려요.</em></h2><p>전체 응답 수, 문항별 그래프, 주관식 요약과 응답자 특성까지. 필요한 결과만 골라 리포트로 저장하고 공유하세요.</p></div><div className="uf26-dashboard" data-reveal><div className="uf26-dashboard__nav"><BrandMark showName={false} /><span>Overview</span><span>Questions</span><span>Respondents</span><span>AI Summary</span><button type="button">리포트 내보내기 ↗</button></div><div className="uf26-dashboard__content"><header><div><small>RESULT REPORT</small><h3>카페 이용과 공간 선호도</h3></div><span>● 모집 중</span></header><div className="uf26-metrics"><article><small>전체 응답</small><strong>128</strong><span>목표의 85%</span></article><article><small>평균 응답 시간</small><strong>03:24</strong><span>−18초 단축</span></article><article><small>완료율</small><strong>94%</strong><span>매우 좋아요</span></article></div><div className="uf26-charts"><article><div><span><small>문항 02</small><h4>카페 선택의 첫 번째 기준</h4></span><b>···</b></div><div className="uf26-bars"><span style={{ '--h': '44%' }}><i>44%</i><b>분위기</b></span><span style={{ '--h': '28%' }}><i>28%</i><b>가격</b></span><span style={{ '--h': '18%' }}><i>18%</i><b>거리</b></span><span style={{ '--h': '10%' }}><i>10%</i><b>메뉴</b></span></div></article><article className="uf26-insight"><span>✦ AI 핵심 요약</span><h4>“응답자의 절반 가까이가<br />가격보다 공간 경험을 우선해요.”</h4><p>20–24세 학생과 프리랜서 그룹에서 ‘콘센트와 좌석 간격’ 언급이 2.1배 많았습니다.</p><div><span># 공간 경험</span><span># 오래 머물기</span><span># 콘센트</span></div></article></div></div></div></section>

      <section className="uf26-features">{features.map(([no, title, copy, metric]) => <article key={no} data-reveal><span>{no}</span><h3>{title}</h3><p>{copy}</p><strong>{metric}</strong></article>)}</section>
      <section className="uf26-final" data-reveal><p>YOUR NEXT SURVEY STARTS HERE</p><h2 className="uf26-final__particle"><ParticleText text="다음 설문, 3시간 아껴볼까요?" color="#070507" highlightColor="#ffffff" particleSize={2.2} density={3} scatter={220} gatherDuration={1500} stagger={260} pointerRepel={36} repelRadius={110} trigger="view" fontSize="clamp(2.6rem,6.4vw,6.4rem)" fontWeight={900} glow={false} /></h2><p>지금 가입하면 무료로 설문 3개까지 만들 수 있어요.<br />카드 등록 없이, 5분이면 첫 설문 세팅 끝.</p><Link to="/signup">무료로 시작하기 <span>↗</span></Link><div className="uf26-final__shapes" aria-hidden="true"><i /><i /><i /><i /></div></section>
      <footer className="uf26-footer"><div><BrandMark light /><p>질문과 사람 사이를 더 가볍게.</p></div><div><a href="#how">서비스 소개</a><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link><Link to="/dashboard">대시보드</Link></div><small>© 2026 UNI-FORM · MADE FOR CURIOUS MINDS</small></footer>
    </main>
  )
}
