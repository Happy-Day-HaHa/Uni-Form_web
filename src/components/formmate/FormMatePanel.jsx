const starterMessages = [
  { role: 'assistant', text: '안녕하세요! 어떤 설문을 만들고 싶으신가요? 먼저 이번 설문의 목적을 알려주세요.' },
]

export default function FormMatePanel({ value, onChange, onCreateDraft, onSend, onUndo, canUndo = false, selectedLabel = '', messages = starterMessages, message = '', buttonLabel = '보내기', applying = false, suggestions = [] }) {
  function submit(event) {
    event.preventDefault()
    if (onSend) onSend(value)
    else onCreateDraft?.()
  }

  function keyDown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }
  return <aside className="formmate-agent">
    <header><div className="formmate-agent__mark">✦</div><div><h2>FormMate <span>Beta</span></h2><p>AI와 함께, 더 좋은 설문을 만들어보세요.</p></div><i>{applying ? '반영 중' : '연결됨'}</i></header>
    {messages.length <= 1 && <div className="formmate-starters"><h3>어떤 설문을 만들고 싶으신가요?</h3><p>주제를 알려주시면 설문 구성을 함께 만들어요.</p><div>{[['▤','처음부터 만들기'],['✦','기존 설문 다듬기'],['☼','문항 추천받기'],['✓','품질 검사하기']].map(([icon,label]) => <button key={label} type="button" onClick={() => onChange(label)}><b>{icon}</b><span>{label}</span><i>→</i></button>)}</div></div>}
    <div className="formmate-agent__messages" aria-live="polite">{messages.map((item, index) => <div className={`formmate-message formmate-message--${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'assistant' ? '✦' : 'U'}</span><p>{item.text}</p></div>)}{applying && <div className="formmate-applying"><i /><i /><i /> 왼쪽 설문에 반영하고 있어요.</div>}</div>
    {suggestions.length > 0 && <div className="formmate-agent__suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>}
    {selectedLabel && <div className="formmate-context"><span>{selectedLabel}</span><button type="button" onClick={() => onChange('')}>×</button></div>}
    <form className="formmate-agent__composer" onSubmit={submit}><textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} rows="2" placeholder="FormMate에게 원하는 내용을 입력하세요." /><button type="submit" aria-label={buttonLabel} disabled={applying}>↗</button></form>
    {canUndo && <button className="formmate-undo" type="button" onClick={onUndo}>↶ 마지막 변경 되돌리기</button>}
    {message && <small className="formmate-agent__status">✓ {message}</small>}
  </aside>
}
