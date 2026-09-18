import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { SUPPORT_EMAIL } from '../constants'
import '../styles/support.css'

const categories = ['회원가입 / 로그인', '설문 제작', 'FormMate', '설문 참여', '리더보드', '팀 관리', '기타 문의']
const faqItems = [
  ['회원가입 / 로그인', '로그인 상태가 유지되지 않아요.', '로그인 화면에서 ‘로그인 상태 유지’를 선택하면 다음 방문에도 세션이 유지됩니다. 공용 기기에서는 선택하지 않는 것을 권장합니다.'],
  ['설문 제작', '만든 설문은 어디에서 관리하나요?', '내 설문에서 진행 상태와 응답 수를 확인하고 설문을 관리할 수 있습니다.'],
  ['FormMate', 'FormMate가 만든 문항을 수정할 수 있나요?', '설문 미리보기의 수정하기를 누르면 제목, 설명, 질문 유형과 선택지를 직접 수정할 수 있습니다.'],
  ['설문 참여', '설문 참여 기록은 어디에 반영되나요?', '제출이 완료된 응답은 이번 주 참여 횟수와 리더보드에 반영됩니다.'],
  ['리더보드', '리더보드는 언제 초기화되나요?', '매주 월요일 00:00에 새로운 주간 순위가 시작됩니다.'],
  ['팀 관리', '팀원과 설문을 함께 수정할 수 있나요?', '팀 관리에서 초대 링크를 공유하고 팀 초안과 응답 현황을 함께 관리할 수 있습니다.'],
]

export default function Support() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('기타 문의')
  const [openFaq, setOpenFaq] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const filteredFaq = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko')
    return faqItems.filter(([type, question, answer]) => !keyword || `${type} ${question} ${answer}`.toLocaleLowerCase('ko').includes(keyword))
  }, [query])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  function submitInquiry(event) {
    event.preventDefault()
    if (!message.trim()) return
    setSubmitted(true)
  }

  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[UniForm 문의] ${category}`)}&body=${encodeURIComponent(message)}`

  return <main className="support-standalone motion-page">
    <header className="support-standalone__header"><Link to="/" aria-label="UniForm 홈"><BrandMark /></Link><button type="button" onClick={goBack}>← UniForm으로 돌아가기</button></header>
    <section className="support-panel" aria-labelledby="support-title">
      <div className="support-panel__intro"><span>고객센터</span><h1 id="support-title">무엇을 도와드릴까요?</h1><p>도움말을 검색하거나 문의 유형을 선택해 내용을 남겨주세요.</p></div>
      <label className="support-search"><span className="sr-only">도움말 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="질문이나 키워드를 입력해주세요." /></label>
      <section className="support-faq" aria-labelledby="faq-title"><h2 id="faq-title">자주 찾는 도움</h2><div className="support-faq-list">
        {filteredFaq.map(([type, question, answer]) => <article className={`support-faq-item ${openFaq === question ? 'is-open' : ''}`} key={question}>
          <button type="button" onClick={() => setOpenFaq(openFaq === question ? '' : question)} aria-expanded={openFaq === question}><span><small>{type}</small>{question}</span><b aria-hidden="true">{openFaq === question ? '−' : '+'}</b></button>
          {openFaq === question && <p>{answer}</p>}
        </article>)}
        {!filteredFaq.length && <p className="support-empty">일치하는 도움말이 없습니다. 아래에서 직접 문의해주세요.</p>}
      </div></section>
      <form className="support-inquiry" onSubmit={submitInquiry}><h2>직접 문의하기</h2><div className="support-category" role="group" aria-label="문의 유형">{categories.map((item) => <button className={category === item ? 'is-selected' : ''} type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><label><span>문의 내용</span><textarea value={message} onChange={(event) => { setMessage(event.target.value); setSubmitted(false) }} placeholder="겪고 있는 문제나 궁금한 내용을 자세히 적어주세요." rows="4" /></label><button className="support-submit" type="submit" disabled={!message.trim()}>문의 준비하기</button>
        {submitted && <div className="support-ready" role="status"><div><b>문의 내용이 준비되었습니다.</b><p>현재 문의는 이메일로 접수됩니다.</p></div><a href={mailHref}>이메일로 보내기</a></div>}
      </form>
    </section>
    <footer><span>{SUPPORT_EMAIL}</span><small>© 2026 UNIFORM</small></footer>
  </main>
}
