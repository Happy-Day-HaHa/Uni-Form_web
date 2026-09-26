import InfiniteSpiral from './InfiniteSpiral'
import './SurveyPainSection.css'

export const surveyPainCards = [
  { id: 1, category: '응답자 모집', text: '설문은 다 만들었는데,\n막상 어디에 올려야 할지가 제일 막막했어요.', meta: '대학생 · 팀 프로젝트' },
  { id: 2, category: '응답 수 부족', text: '마감은 다가오는데\n필요한 응답 수가 절반도 안 모였어요.', meta: '대학생 · 리서치 과제' },
  { id: 3, category: '단체 채팅방', text: '단톡방에 계속 올리기도 눈치 보이고,\n그렇다고 기다리기만 할 수도 없었어요.', meta: '대학생 · 과제 설문' },
  { id: 4, category: '지인 의존', text: '결국 친구들한테 부탁하다 보니\n비슷한 사람들만 응답하게 되더라고요.', meta: '대학생 · 팀 프로젝트' },
  { id: 5, category: '커뮤니티', text: '에브리타임에 올려도 금방 글이 밀려서\n계속 확인해야 했어요.', meta: '대학생 · 설문 조사' },
  { id: 6, category: '모집 시간', text: '설문 만드는 시간보다\n응답자 구하는 데 더 오래 걸린 것 같아요.', meta: '대학생 · 팀 프로젝트' },
  { id: 7, category: '반복 요청', text: '한 번 부탁한 친구한테\n또 설문해달라고 말하기가 미안했어요.', meta: '대학생 · 개인 과제' },
  { id: 8, category: '참여 동기', text: '보상도 없는데 참여해달라고 하려니\n사람들에게 부탁하기가 애매했어요.', meta: '대학생 · 연구 설문' },
]

function SurveyPainCard({ category, text, meta }) {
  return <article className="survey-pain-card">
    <header><span>{category}</span><b aria-hidden="true">”</b></header>
    <p>{text}</p>
    <small>{meta}</small>
  </article>
}

export default function SurveyPainSection() {
  return <section className="survey-pain-section" aria-labelledby="survey-pain-title">
    <header className="survey-pain-heading" data-motion-reveal>
      <span>REAL VOICES</span>
      <h2 id="survey-pain-title">설문은 완성됐는데,<br /><em>참여자는 충분한가요?</em></h2>
      <p>많은 대학생들이 설문은 쉽게 만들지만,<br />정작 응답자를 모으는 과정에서 어려움을 겪고 있어요.</p>
    </header>
    <div className="survey-pain-spiral" data-motion-reveal style={{ '--delay': '100ms' }}>
      <InfiniteSpiral
        items={surveyPainCards}
        renderItem={(item) => <SurveyPainCard {...item} />}
        animationMode="auto"
        speed={0.28}
        radius={340}
        cardWidth={410}
        cardHeight={156}
        verticalSpacing={118}
        perspective={1350}
        centerScale={1.06}
        edgeBlur={5}
        cardsPerTurn={7}
        pauseOnHover
        direction="up"
        rotation={-3}
        edgeFade={0.45}
      />
    </div>
    <p className="survey-pain-note">대학생 팀 프로젝트에서 흔히 겪는 상황을 바탕으로 재구성한 예시입니다.</p>
  </section>
}
