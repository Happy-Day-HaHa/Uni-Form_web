import { useEffect, useRef, useState } from 'react'
import '../../styles/formmate-changes.css'

const starterMessages = [
  { role: 'assistant', text: '안녕하세요! 어떤 설문을 만들고 싶으신가요? 먼저 이번 설문의 목적을 알려주세요.' },
]

const changeTypeLabels = { ADD_QUESTION: '문항 추가', UPDATE_QUESTION: '문항 수정', DELETE_QUESTION: '문항 삭제', UPDATE_OPTION: '보기 수정' }
const questionTypeLabels = { single: '단일 선택', multiple: '복수 선택', scale: '척도형', text: '단답형', long: '장문형' }

// FormMate가 제안한 변경 목록. 고른 것만 적용하고, 적용한 것은 되돌릴 수 있다.
function FormMateChangeCards({ changes, busy, onApply, onRevert }) {
  const [unchecked, setUnchecked] = useState(() => new Set())
  const pending = changes.filter((change) => change.status === 'pending')
  const selected = pending.filter((change) => !unchecked.has(change.id))
  const applied = changes.filter((change) => change.status === 'applied')
  function toggle(id) { setUnchecked((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next }) }

  return <div className="formmate-changes">
    {changes.map((change) => <label className={`formmate-change formmate-change--${change.status}`} key={change.id}>
      {change.status === 'pending' ? <input type="checkbox" checked={!unchecked.has(change.id)} disabled={busy} onChange={() => toggle(change.id)} /> : <i aria-hidden="true">{change.status === 'applied' ? '✓' : '↺'}</i>}
      <div>
        <header><em>{changeTypeLabels[change.type] || change.type}</em>{change.status === 'applied' && <small>적용됨</small>}{change.status === 'reverted' && <small>되돌림</small>}</header>
        <b>{change.summary}</b>
        {change.question && <p>{change.question.title}<span>{questionTypeLabels[change.question.type]}{change.question.options?.length ? ` · ${change.question.options.join(' / ')}` : ''}</span></p>}
      </div>
    </label>)}
    <footer>
      {pending.length > 0 && <button type="button" disabled={busy || !selected.length} onClick={() => onApply(selected.map((change) => change.id))}>선택한 제안 적용 ({selected.length})</button>}
      {applied.length > 0 && <button type="button" className="is-secondary" disabled={busy} onClick={() => onRevert(applied.map((change) => change.id))}>적용한 제안 되돌리기</button>}
    </footer>
  </div>
}

export default function FormMatePanel({ value, onChange, onCreateDraft, onSend, onUndo, onApplyChanges, onRevertChanges, canUndo = false, selectedLabel = '', messages = starterMessages, message = '', buttonLabel = '보내기', applying = false, busyLabel = '설문에 반영하고 있어요.', suggestions = [], draftSummary = null }) {
  const composerRef = useRef(null)

  useEffect(() => {
    const textarea = composerRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    const nextHeight = Math.min(96, Math.max(40, textarea.scrollHeight))
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > 96 ? 'auto' : 'hidden'
  }, [value])

  function submit(event) {
    event.preventDefault()
    if (!value.trim() || applying) return
    if (onSend) onSend(value)
    else onCreateDraft?.()
  }

  function keyDown(event) { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }
  return <aside className="formmate-agent">
    <header><div><h2>FormMate</h2><p>설문 제작을 함께 도와드릴게요.</p></div></header>
    <div className="formmate-agent__messages" aria-live="polite">{messages.map((item, index) => <div className="formmate-thread-item" key={`${item.role}-${index}`}><div className={`formmate-message formmate-message--${item.role}`}><p>{item.text}</p></div>{item.changes?.length > 0 && <FormMateChangeCards changes={item.changes} busy={applying} onApply={(ids) => onApplyChanges?.(index, ids)} onRevert={(ids) => onRevertChanges?.(index, ids)} />}</div>)}
      {messages.length <= 1 && <div className="formmate-examples"><span>이렇게 물어보세요</span>{['Z세대의 소비 트렌드에 대한 설문을 만들어줘', '대학생의 학습 플랫폼 이용 경험에 대해 10문항 정도 구성해줘', '3분 이내에 끝나는 간단한 만족도 조사를 만들어줘'].map((item) => <button key={item} type="button" onClick={() => onChange(item)}>“{item}”</button>)}</div>}
      {draftSummary && messages.length > 1 && <button className="formmate-draft-card" type="button" onClick={draftSummary.onOpen}><div><b>{draftSummary.title || '제목 없는 설문'}</b><small>{draftSummary.count}문항 · 약 {draftSummary.minutes}분 소요</small></div><em>초안</em></button>}
      {applying && <div className="formmate-applying"><i /><i /><i /> {busyLabel}</div>}
    </div>
    {suggestions.length > 0 && <div className="formmate-agent__suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>}
    {selectedLabel && <div className="formmate-context"><span>{selectedLabel}</span><button type="button" onClick={() => onChange('')}>×</button></div>}
    <form className="formmate-agent__composer" onSubmit={submit}><textarea ref={composerRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} rows="1" placeholder="추가 요청을 입력하세요..." aria-label="FormMate에게 보낼 메시지" /><button type="submit" aria-label={buttonLabel} title={buttonLabel} disabled={applying || !value.trim()}><span aria-hidden="true">→</span></button></form>
    <div className="formmate-quick-actions">{['주제 추천', '문항 추가', '말투 변경'].map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>
    {canUndo && <button className="formmate-undo" type="button" onClick={onUndo}>마지막 변경 되돌리기</button>}
    {message && <small className="formmate-agent__status">{message}</small>}
  </aside>
}
