const starterMessages = [
  { role: 'assistant', text: '안녕하세요! 어떤 설문을 만들고 싶으신가요? 먼저 이번 설문의 목적을 알려주세요.' },
]

export default function FormMatePanel({ value, onChange, onCreateDraft, onSend, messages = starterMessages, message = '', buttonLabel = '보내기', applying = false, suggestions = [] }) {
  function submit(event) {
    event.preventDefault()
    if (onSend) onSend(value)
    else onCreateDraft?.()
  }

  return <aside className="formmate-agent">
    <header><div className="formmate-agent__mark">✦</div><div><h2>AI 설문 도우미 <span>Beta</span></h2><p>대화하며 필요한 설문을 함께 구성해보세요.</p></div><i>{applying ? '반영 중' : '연결됨'}</i></header>
    <div className="formmate-agent__messages" aria-live="polite">{messages.map((item, index) => <div className={`formmate-message formmate-message--${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'assistant' ? '✦' : 'U'}</span><p>{item.text}</p></div>)}{applying && <div className="formmate-applying"><i /><i /><i /> 왼쪽 설문에 반영하고 있어요.</div>}</div>
    {suggestions.length > 0 && <div className="formmate-agent__suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => onChange(item)}>{item}</button>)}</div>}
    <form className="formmate-agent__composer" onSubmit={submit}><textarea value={value} onChange={(event) => onChange(event.target.value)} rows="2" placeholder="원하는 내용을 자유롭게 입력하세요." /><button type="submit" aria-label={buttonLabel}>↗</button></form>
    {message && <small className="formmate-agent__status">✓ {message}</small>}
  </aside>
}
