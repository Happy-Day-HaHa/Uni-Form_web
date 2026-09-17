import { useState } from 'react'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { SUPPORT_EMAIL } from '../constants'
import { useReveal } from '../hooks/useReveal'
import '../styles/support.css'

const inquiryTypes = [
  ['계정', '로그인, 회원가입, 비밀번호 관련 문의'],
  ['설문 오류', '설문 제작·응답 중 발생한 오류 신고'],
  ['신고', '부적절한 설문 또는 사용자 신고'],
  ['제휴/기타', '제휴 제안, 그 외 문의'],
]

const faqItems = [
  ['설문에 응답하면 어떻게 되나요?', '설문 응답 1건을 제출할 때마다 이번 주 응답 횟수 리더보드에 1점이 반영됩니다.'],
  ['리더보드는 언제 초기화되나요?', '매주 월요일 00:00에 점수가 초기화되고 새로운 한 주가 시작됩니다.'],
  ['보상은 어떻게 받나요?', '매주 TOP 10에게 안내된 보상이 지급됩니다. 순위 발표 후 등록된 이메일로 안내드려요.'],
  ['점수가 같으면 순위는 어떻게 정하나요?', '동점일 경우 먼저 해당 점수에 도달한 사용자가 더 높은 순위로 표시됩니다.'],
  ['UniForm은 어떤 서비스인가요?', '대학(원)생이 설문을 만들고, 응답하고, 결과를 확인하는 과정을 하나의 흐름으로 연결한 설문조사 플랫폼입니다.'],
]

export default function Support() {
  const [copied, setCopied] = useState(false)
  const [openFaq, setOpenFaq] = useState('')
  const rootRef = useReveal([])

  async function copyEmail() {
    try { await navigator.clipboard.writeText(SUPPORT_EMAIL); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    catch { /* clipboard unavailable */ }
  }

  return <ServiceShell activePath="/support"><div ref={rootRef}>
    <ServiceHeading icon="?" title="고객센터" description="궁금한 점이나 불편한 점을 알려주시면 빠르게 도와드릴게요." />

    <section className="support-contact ui-card" data-motion-reveal>
      <div><span>운영 이메일</span><strong>{SUPPORT_EMAIL}</strong></div>
      <div className="support-contact__actions">
        <button className="ui-button ui-button--secondary" type="button" onClick={copyEmail}>{copied ? '복사됨 ✓' : '주소 복사'}</button>
        <a className="ui-button" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[UniForm 문의]')}`}>이메일 보내기</a>
      </div>
    </section>

    <section className="support-types" data-motion-reveal>
      <h2>문의 유형</h2>
      <div className="support-type-grid">{inquiryTypes.map(([label, copy]) => <a className="support-type-card ui-card" key={label} href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[UniForm 문의] ${label}`)}`}><b>{label}</b><p>{copy}</p></a>)}</div>
    </section>

    <section className="support-faq" data-motion-reveal>
      <h2>자주 묻는 질문</h2>
      <div className="support-faq-list">{faqItems.map(([question, answer]) => <div className={`support-faq-item ${openFaq === question ? 'is-open' : ''}`} key={question}>
        <button type="button" onClick={() => setOpenFaq(openFaq === question ? '' : question)} aria-expanded={openFaq === question}>{question}<span>{openFaq === question ? '−' : '+'}</span></button>
        {openFaq === question && <p>{answer}</p>}
      </div>)}</div>
    </section>
  </div></ServiceShell>
}
