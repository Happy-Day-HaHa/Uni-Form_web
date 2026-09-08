export default function FormMatePanel({ value, onChange, onCreateDraft, message = '', buttonLabel = '질문 초안 만들기' }) {
  return (
    <aside className="ai-draft-panel">
      <div className="workspace-label"><span>02</span><b>FORMMATE</b></div>
      <div><span>✦ AI SURVEY PARTNER</span><h2>어떤 설문이 필요한가요?</h2><p>목적과 응답 대상을 편하게 적으면 질문과 보기를 한 번에 구성해드려요.</p></div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="5" placeholder="예: 대학생의 통학 경험과 만족도를 알아보고 싶어요." />
      <button type="button" onClick={onCreateDraft}>{buttonLabel} →</button>
      {message && <small>{message}</small>}
    </aside>
  )
}
