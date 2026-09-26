import { useState } from 'react'
import Modal from '../Modal'

const labels = { active: '활성', draft: '임시저장', closed: '마감', archived: '보관', removed: '운영 삭제', restricted: '이용 제한', pending: '인증 대기', withdrawn: '탈퇴', STAFF: '운영팀', ADMIN: '관리자', warning: '경고 후 제출', excluded: '집계 제외' }
export function StatusBadge({ value, children }) { return <span className={`admin-badge admin-badge--${String(value).toLowerCase()}`}>{children || labels[value] || value}</span> }
export function PageHeader({ eyebrow, title, description, actions }) { return <header className="admin-page-head"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="admin-page-head__actions">{actions}</div>}</header> }
export function Empty({ title = '조건에 맞는 항목이 없어요', description = '검색어나 필터를 바꿔보세요.' }) { return <div className="admin-empty"><b>{title}</b><p>{description}</p></div> }
export function Loading() { return <div className="admin-loading">데이터를 불러오고 있어요.</div> }
export function AdminTabs({ items, current, onChange }) { return <nav className="admin-tabs">{items.map(([key, label]) => <button key={key} type="button" className={current === key ? 'active' : ''} onClick={() => onChange(key)}>{label}</button>)}</nav> }
export function ActionModal({ open, title, description, reasons = ['운영 정책 위반', '사용자 요청', '기타'], emailText, confirmLabel = '확인', danger = false, onClose, onConfirm, extra }) {
  const [reason, setReason] = useState(reasons[0] || '')
  const [memo, setMemo] = useState('')
  const [restrictionDays, setRestrictionDays] = useState('7')
  const showsRestrictionPeriod = title?.includes('이용을 제한')
  async function confirm() { await onConfirm({ reason, memo, restrictionDays }); setMemo(''); onClose() }
  return <Modal open={open} title={title} onClose={onClose}><div className="admin-action-modal">
    <p>{description}</p>
    {extra}
    {showsRestrictionPeriod && <label>제한 기간<select value={restrictionDays} onChange={(event) => setRestrictionDays(event.target.value)}><option value="7">7일</option><option value="30">30일</option><option value="indefinite">무기한</option></select></label>}
    <label>사유 분류<select value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>메모 <em>필수</em><textarea rows="4" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="처리 근거를 구체적으로 남겨주세요." /></label>
    {emailText && <div className="admin-email-note">{emailText}에게 이메일로 알려요.</div>}
    <div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" onClick={onClose}>취소</button><button className={`ui-button ${danger ? 'ui-button--danger' : ''}`} type="button" disabled={!memo.trim()} onClick={confirm}>{confirmLabel}</button></div>
  </div></Modal>
}
export function Toast({ children }) { return children ? <div className="service-toast" role="status">✓ {children}</div> : null }
