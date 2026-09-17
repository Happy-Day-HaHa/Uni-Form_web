const starterMessages = [
  { role: 'assistant', text: '안녕하세요! 어떤 설문을 만들고 싶으신가요? 먼저 이번 설문의 목적을 알려주세요.' },
]

export default function FormMatePanel({ value, onChange, onCreateDraft, onSend, onUndo, canUndo = false, selectedLabel = '', messages = starterMessages, message = '', buttonLabel = '보내기', applying = false, suggestions = [], draftSummary = null }) {
  function submit(event) {
    event.preventDefault()
    if (onSend) onSend(value)
    else onCreateDraft?.()
  }

  function keyDown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }
  return <aside className="formmate-agent">
    <header><div className="formmate-agent__mark">✦</div><div><h2>FormMate <span>Beta</span></h2><p>AI와 함께, 더 좋은 설문을 만들어보세요.</p></div><i>{applying ? '반영 중' : '연결됨'}</i></header>
    <div className="formmate-agent__messages" aria-live="polite">{messages.map((item, index) => <div className={`formmate-message formmate-message--${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'assistant' ? '◢' : 'U'}</span><p>{item.text}</p></div>)}
      {messages.length <= 1 && <div className="formmate-examples"><span>이렇게 물어보세요</span>{['Z세대의 소비 트렌드에 대한 설문을 만들어줘', '대학생의 학습 플랫폼 이용 경험에 대해 10문항 정도 구성해줘', '3분 이내에 끝나는 간단한 만족도 조사를 만들어줘'].map((item) => <button key={item} type="button" onClick={() => onChange(item)}>“{item}”</button>)}</div>}
      {draftSummary && messages.length > 1 && <button className="formmate-draft-card" type="button" onClick={draftSummary.onOpen}><span>▣</span><div><b>{draftSummary.title || '제목 없는 설문'}</b><small>{draftSummary.count}문항 · 약 {draftSummary.minutes}분 소요</small></div><em>초안</em><i>›</i></button>}
      {applying && <div className="formmate-applying"><i /><i /><i /> 설문에 반영하고 있어요.</div>}
    </div>
    {suggestions.length > 0 && <div className="formmate-agent__suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>}
    {selectedLabel && <div className="formmate-context"><span>{selectedLabel}</span><button type="button" onClick={() => onChange('')}>×</button></div>}
    <form className="formmate-agent__composer" onSubmit={submit}><span aria-hidden="true">⌕</span><textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} rows="2" placeholder="원하는 설문을 자유롭게 요청해보세요." /><button type="submit" aria-label={buttonLabel} disabled={applying}>➤</button></form>
    <div className="formmate-quick-actions">{['설문 주제 추천받기', '문항 추가하기', '톤 앤 매너 변경', '대상 설정하기'].map((item) => <button type="button" key={item} onClick={() => onChange(item)}>＋ {item}</button>)}</div>
    {canUndo && <button className="formmate-undo" type="button" onClick={onUndo}>↶ 마지막 변경 되돌리기</button>}
    {message && <small className="formmate-agent__status">✓ {message}</small>}
  </aside>
}
