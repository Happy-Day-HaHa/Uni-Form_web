import { useEffect, useState } from 'react'
import LoadingState from '../LoadingState'
import Modal from '../Modal'

const labels = { active: '활성', draft: '임시저장', closed: '마감', archived: '보관', removed: '운영 삭제', restricted: '이용 제한', pending: '인증 대기', withdrawn: '탈퇴', STAFF: '운영팀', ADMIN: '관리자', warning: '경고 후 제출', excluded: '집계 제외' }
const actionErrorMessages = {
  PURGED: '응답 원문이 이미 파기되어 처리할 수 없어요.',
  WEEK_LOCKED: '순위가 확정된 주차라 점수를 변경할 수 없어요.',
  WRONG_STEP: '현재 정산 단계에서는 이 작업을 진행할 수 없어요. 화면을 새로고침해주세요.',
  FORBIDDEN: '이 작업을 수행할 관리자 권한이 없어요.',
  NOT_FOUND: '대상을 찾을 수 없어요. 이미 변경되었는지 확인해주세요.',
}
export function getAdminErrorMessage(error) {
  const source = `${error?.code || ''} ${error?.message || ''}`
  const matched = Object.keys(actionErrorMessages).find((code) => source.includes(code))
  if (matched) return actionErrorMessages[matched]
  if (error?.status === 401 || error?.statusCode === 401) return '로그인이 만료됐어요. 다시 로그인해주세요.'
  if (error?.status === 403 || error?.statusCode === 403) return actionErrorMessages.FORBIDDEN
  if (error?.status === 404 || error?.statusCode === 404) return actionErrorMessages.NOT_FOUND
  return error?.message || '처리하지 못했어요. 잠시 후 다시 시도해주세요.'
}
export function StatusBadge({ value, children, scope }) { const key = `${scope ? `${scope}-` : ''}${String(value).toLowerCase()}`; return <span className={`admin-badge admin-badge--${key}`}>{children || labels[value] || value}</span> }
export function PageHeader({ eyebrow, title, description, actions }) { return <header className="admin-page-head"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="admin-page-head__actions">{actions}</div>}</header> }
export function Empty({ title = '조건에 맞는 항목이 없어요', description = '검색어나 필터를 바꿔보세요.' }) { return <div className="admin-empty"><b>{title}</b><p>{description}</p></div> }
export function Loading() { return <LoadingState>데이터를 불러오고 있어요.</LoadingState> }
export function AdminTabs({ items, current, onChange }) { return <nav className="admin-tabs">{items.map(([key, label]) => <button key={key} type="button" className={current === key ? 'active' : ''} onClick={() => onChange(key)}>{label}</button>)}</nav> }
export function Pagination({ page, totalItems, pageSize = 20, onChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  return <nav className="admin-pagination" aria-label="페이지 이동"><button type="button" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)}>이전</button>{pages.map((number) => <button key={number} type="button" className={number === currentPage ? 'active' : ''} aria-current={number === currentPage ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>)}<button type="button" disabled={currentPage >= totalPages} onClick={() => onChange(currentPage + 1)}>다음</button></nav>
}
export function ActionModal({ open, title, description, reasons = ['운영 정책 위반', '사용자 요청', '기타'], reasonRequired = true, memoRequired = true, emailText, confirmLabel = '확인', danger = false, onClose, onConfirm, extra }) {
  const [reason, setReason] = useState(reasons[0] || '')
  const [memo, setMemo] = useState('')
  const [restrictionDays, setRestrictionDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const showsRestrictionPeriod = title?.includes('이용을 제한')
  const categoryOptional = /복구|해제|운영팀 설정/.test(title || '')
  const effectiveReasonRequired = reasonRequired && !categoryOptional
  const effectiveMemoRequired = memoRequired && !title?.includes('운영팀 설정')
  useEffect(() => { if (open) { setReason(reasons[0] || ''); setMemo(''); setRestrictionDays('7'); setError(''); setSubmitting(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  async function confirm() {
    if (submitting || (effectiveReasonRequired && !reason) || (effectiveMemoRequired && !memo.trim())) return
    try { setSubmitting(true); setError(''); await onConfirm({ reason, memo, restrictionDays }); setMemo(''); onClose() }
    catch (actionError) { setError(getAdminErrorMessage(actionError)) }
    finally { setSubmitting(false) }
  }
  return <Modal open={open} title={title} onClose={onClose}><div className="admin-action-modal">
    <p>{description}</p>
    {extra}
    {showsRestrictionPeriod && <label>제한 기간<select value={restrictionDays} onChange={(event) => setRestrictionDays(event.target.value)}><option value="7">7일</option><option value="30">30일</option><option value="indefinite">무기한</option></select></label>}
    {reasons.length > 0 && !categoryOptional && <label>사유 분류<select value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></label>}
    <label>메모 {effectiveMemoRequired && <em>필수</em>}<textarea rows="4" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder={effectiveMemoRequired ? '처리 근거를 구체적으로 남겨주세요.' : '필요한 경우 처리 메모를 남겨주세요.'} /></label>
    {emailText && <div className="admin-email-note">{emailText}에게 이메일로 알려요.</div>}
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" disabled={submitting} onClick={onClose}>취소</button><button className={`ui-button ${danger ? 'ui-button--danger' : ''}`} type="button" disabled={submitting || (effectiveReasonRequired && !reason) || (effectiveMemoRequired && !memo.trim())} onClick={confirm}>{submitting ? '처리 중…' : confirmLabel}</button></div>
  </div></Modal>
}
export function Toast({ children }) { return children ? <div className="service-toast" role="status">✓ {children}</div> : null }
