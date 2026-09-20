import { useEffect, useRef } from 'react'

const starterMessages = [
  { role: 'assistant', text: '안녕하세요! 어떤 설문을 만들고 싶으신가요? 먼저 이번 설문의 목적을 알려주세요.' },
]

export default function FormMatePanel({ value, onChange, onCreateDraft, onSend, onUndo, canUndo = false, selectedLabel = '', messages = starterMessages, message = '', buttonLabel = '보내기', applying = false, suggestions = [], draftSummary = null }) {
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
    <header><div><h2>FormMate</h2><p>대화로 설문 초안을 만들어보세요.</p></div><i>{applying ? '반영 중' : '준비됨'}</i></header>
    <div className="formmate-agent__messages" aria-live="polite">{messages.map((item, index) => <div className={`formmate-message formmate-message--${item.role}`} key={`${item.role}-${index}`}><p>{item.text}</p></div>)}
      {messages.length <= 1 && <div className="formmate-examples"><span>이렇게 물어보세요</span>{['Z세대의 소비 트렌드에 대한 설문을 만들어줘', '대학생의 학습 플랫폼 이용 경험에 대해 10문항 정도 구성해줘', '3분 이내에 끝나는 간단한 만족도 조사를 만들어줘'].map((item) => <button key={item} type="button" onClick={() => onChange(item)}>“{item}”</button>)}</div>}
      {draftSummary && messages.length > 1 && <button className="formmate-draft-card" type="button" onClick={draftSummary.onOpen}><div><b>{draftSummary.title || '제목 없는 설문'}</b><small>{draftSummary.count}문항 · 약 {draftSummary.minutes}분 소요</small></div><em>초안</em></button>}
      {applying && <div className="formmate-applying"><i /><i /><i /> 설문에 반영하고 있어요.</div>}
    </div>
    {suggestions.length > 0 && <div className="formmate-agent__suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>}
    {selectedLabel && <div className="formmate-context"><span>{selectedLabel}</span><button type="button" onClick={() => onChange('')}>×</button></div>}
    <form className="formmate-agent__composer" onSubmit={submit}><textarea ref={composerRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} rows="1" placeholder="추가로 요청할 내용을 입력하세요." /><button type="submit" aria-label={buttonLabel} disabled={applying || !value.trim()}><span aria-hidden="true">→</span><span className="sr-only">{buttonLabel}</span></button></form>
    <div className="formmate-quick-actions">{['주제 추천', '문항 추가', '말투 변경', '대상 설정'].map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>
    {canUndo && <button className="formmate-undo" type="button" onClick={onUndo}>마지막 변경 되돌리기</button>}
    {message && <small className="formmate-agent__status">{message}</small>}
  </aside>
}
