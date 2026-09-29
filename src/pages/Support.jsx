import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { SUPPORT_EMAIL } from '../constants'
import { useAuth } from '../hooks/useAuth'
import { submitInquiry } from '../services/supportService'
import { isEmail } from '../utils/validation'
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
  // 로그인 확인이 끝나기 전에는 비로그인으로 단정하지 않는다(이메일 칸이 잠깐 보였다 사라지지 않게).
  const { user, loading: authLoading } = useAuth()
  const needsEmail = !authLoading && !user
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const filteredFaq = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko')
    return faqItems.filter(([type, question, answer]) => !keyword || `${type} ${question} ${answer}`.toLocaleLowerCase('ko').includes(keyword))
  }, [query])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!subject.trim() || !message.trim()) return setError('제목과 문의 내용을 입력해주세요.')
    // 로그인하지 않았으면 답변받을 이메일이 필요하다(로그인 상태면 서버가 계정 이메일을 쓴다).
    if (needsEmail && !isEmail(email.trim())) return setError('답변받을 이메일 주소를 입력해주세요.')
    try {
      setSending(true)
      const result = await submitInquiry({ subject: `[${category}] ${subject.trim()}`.slice(0, 200), message: message.trim(), email: needsEmail ? email.trim() : undefined })
      setSubmitted(result)
      setSubject(''); setMessage('')
    } catch (reason) {
      setError(reason.messages?.length > 1 ? reason.messages.join(' · ') : reason.message || '문의를 접수하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

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
      <form className="support-inquiry" onSubmit={handleSubmit}><h2>직접 문의하기</h2><div className="support-category" role="group" aria-label="문의 유형">{categories.map((item) => <button className={category === item ? 'is-selected' : ''} type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label><span>제목</span><input value={subject} maxLength={150} onChange={(event) => { setSubject(event.target.value); setSubmitted(null) }} placeholder="문의 제목을 입력해주세요." /></label>
        <label><span>문의 내용</span><textarea value={message} maxLength={2000} onChange={(event) => { setMessage(event.target.value); setSubmitted(null) }} placeholder="겪고 있는 문제나 궁금한 내용을 자세히 적어주세요." rows="4" /></label>
        {needsEmail && <label><span>답변받을 이메일</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="hello@example.com" /></label>}
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <button className="support-submit" type="submit" disabled={sending || authLoading || !subject.trim() || !message.trim()}>{sending ? '보내는 중…' : '문의 보내기'}</button>
        {submitted && <div className="support-ready" role="status"><div><b>문의가 접수되었습니다.</b><p>{user ? '가입한 이메일' : '입력한 이메일'}로 답변을 보내드릴게요.</p></div></div>}
      </form>
    </section>
    <footer><span>{SUPPORT_EMAIL}</span><small>© 2026 UNIFORM</small></footer>
  </main>
}
