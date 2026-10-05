import { Link, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'
import { SUPPORT_EMAIL, TERMS_VERSION } from '../constants'
import '../styles/support.css'
import '../styles/legal.css'

// 이용약관·개인정보 처리방침 공통 레이아웃. sections: [{ id, heading, body }]
// 본문은 운영팀이 채운다 — 아직 정해지지 않은 부분은 <Pending>으로 표시해 둔다.
export function Pending({ children = '내용 작성 예정' }) {
  return <span className="legal-pending">[{children}]</span>
}

export default function LegalDocument({ title, intro, sections }) {
  const navigate = useNavigate()
  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return <main className="support-standalone legal-page motion-page">
    <header className="support-standalone__header"><Link to="/" aria-label="UniForm 홈"><BrandMark /></Link><button type="button" onClick={goBack}>← 돌아가기</button></header>
    <article className="legal-document" aria-labelledby="legal-title">
      <header className="legal-document__head">
        <span>UNIFORM 정책</span>
        <h1 id="legal-title">{title}</h1>
        <p>{intro}</p>
        <dl><div><dt>문서 버전</dt><dd>{TERMS_VERSION}</dd></div><div><dt>시행일</dt><dd><Pending>시행일 확정 예정</Pending></dd></div></dl>
      </header>
      <nav className="legal-document__toc" aria-label="목차"><b>목차</b><ol>{sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>)}</ol></nav>
      {sections.map((section) => <section className="legal-document__section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}><h2 id={`${section.id}-title`}>{section.heading}</h2>{section.body}</section>)}
    </article>
    <footer><span>문의 {SUPPORT_EMAIL}</span><nav className="legal-links" aria-label="정책 문서"><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보 처리방침</Link><Link to="/support">고객센터</Link></nav><small>© 2026 UNIFORM</small></footer>
  </main>
}
