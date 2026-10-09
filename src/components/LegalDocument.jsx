import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'
import { POLICY_EFFECTIVE_DATE, SUPPORT_EMAIL } from '../constants'
import { parseLegalDocument } from '../utils/legalMarkdown'
import '../styles/support.css'
import '../styles/legal.css'

// 이용약관·개인정보 처리방침 공통 레이아웃. 본문은 src/content/legal/*.md 원문을 그대로 그린다.
// 원문의 "[배포일로 기재]"(문서 버전·시행일)는 POLICY_EFFECTIVE_DATE로 바꾸고, 값이 없으면 "시행일 확정 예정"으로 표시한다.
const EFFECTIVE_DATE_TOKEN = '[배포일로 기재]'

export function Pending({ children = '내용 작성 예정' }) {
  return <span className="legal-pending">[{children}]</span>
}

function EffectiveDate() {
  return POLICY_EFFECTIVE_DATE ? POLICY_EFFECTIVE_DATE : <Pending>시행일 확정 예정</Pending>
}

function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[배포일로 기재\])/)
  return parts.map((part, index) => {
    if (part === EFFECTIVE_DATE_TOKEN) return <EffectiveDate key={index} />
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>
    return <Fragment key={index}>{part}</Fragment>
  })
}

function List({ list }) {
  const items = list.items.map((item, index) => <li key={index} value={item.number ?? undefined}><Inline text={item.text} />{item.children && <List list={item.children} />}</li>)
  return list.ordered ? <ol>{items}</ol> : <ul>{items}</ul>
}

function Block({ block }) {
  if (block.type === 'heading') return block.level === 3 ? <h3><Inline text={block.text} /></h3> : <h2><Inline text={block.text} /></h2>
  if (block.type === 'list') return <List list={block} />
  if (block.type === 'table') {
    return <div className="legal-table-wrap" role="region" tabIndex={0} aria-label="표 (좌우로 스크롤할 수 있어요)">
      <table className={`legal-table${block.head.length >= 4 ? ' legal-table--wide' : ''}`}>
        <thead><tr>{block.head.map((cell, index) => <th scope="col" key={index}><Inline text={cell} /></th>)}</tr></thead>
        <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index}><Inline text={cell} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  }
  return <p>{block.lines.map((line, index) => <Fragment key={index}>{index > 0 && <br />}<Inline text={line} /></Fragment>)}</p>
}

export default function LegalDocument({ source }) {
  const navigate = useNavigate()
  const doc = parseLegalDocument(source)
  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return <main className="support-standalone legal-page motion-page">
    <header className="support-standalone__header"><Link to="/" aria-label="UniForm 홈"><BrandMark /></Link><button type="button" onClick={goBack}>← 돌아가기</button></header>
    <article className="legal-document" aria-labelledby="legal-title">
      <header className="legal-document__head">
        <span>UNIFORM 정책</span>
        <h1 id="legal-title">{doc.title}</h1>
        {doc.preamble.length > 0 && <div className="legal-document__intro">{doc.preamble.map((block, index) => <Block key={index} block={block} />)}</div>}
        <dl><div><dt>문서 버전</dt><dd><Inline text={doc.meta['문서 버전'] ?? ''} /></dd></div><div><dt>시행일</dt><dd><EffectiveDate /></dd></div></dl>
      </header>
      <nav className="legal-document__toc" aria-label="목차"><b>목차</b><ol>{doc.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>)}</ol></nav>
      {doc.sections.map((section) => <section className="legal-document__section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}><h2 id={`${section.id}-title`}>{section.heading}</h2>{section.blocks.map((block, index) => <Block key={index} block={block} />)}</section>)}
    </article>
    <footer><span>문의 {SUPPORT_EMAIL}</span><nav className="legal-links" aria-label="정책 문서"><Link to="/terms">이용약관</Link><Link to="/privacy">개인정보 처리방침</Link><Link to="/support">고객센터</Link></nav><small>© 2026 UNIFORM</small></footer>
  </main>
}
