export default function QuestionItem({ question, value, onChange, index, error = false, etcValue = '', onEtcChange }) {
  const name = `question-${question.id}`
  const number = String(index + 1).padStart(2, '0')
  const required = question.required === true
  const errorId = `${name}-error`

  return <fieldset id={name} className={`question ${error ? 'question--error' : ''}`} aria-invalid={error || undefined} aria-describedby={error ? errorId : undefined}>
    <legend className="question__sr-legend">{number}. {question.title}{required ? ' (필수 응답)' : ' (선택 응답)'}</legend>
    <div className="question__heading" aria-hidden="true">
      <span>{number}</span>
      <strong>{question.title}{required ? <em className="question__required-mark">*</em> : <small className="question__optional-tag">선택</small>}</strong>
    </div>
    {question.type === 'single' && <div className="option-grid">{question.options.map((option) => <label key={option}><input type="radio" name={name} value={option} checked={value === option} onChange={(event) => onChange(event.target.value)} /><span>{option}</span></label>)}</div>}
    {question.type === 'single' && question.etcLabel && value === question.etcLabel && <input type="text" maxLength={50} value={etcValue} onChange={(event) => onEtcChange?.(event.target.value)} placeholder="기타 내용을 입력해주세요. (최대 50자)" aria-label={`${number}번 문항 기타 입력`} />}
    {question.type === 'multiple' && (question.minSelect || question.maxSelect) && <p className="question__hint">최소 {question.minSelect || 1}개 · 최대 {question.maxSelect || question.options.length}개 선택</p>}
    {question.type === 'multiple' && <div className="option-grid">{question.options.map((option) => { const selected = Array.isArray(value) && value.includes(option); const atMax = Array.isArray(value) && value.length >= (question.maxSelect || question.options.length); return <label key={option}><input type="checkbox" checked={selected} disabled={!selected && atMax} onChange={() => { const current = Array.isArray(value) ? value : []; onChange(selected ? current.filter((item) => item !== option) : [...current, option]) }} /><span>{option}</span></label> })}</div>}
    {question.type === 'scale' && <div className="scale-grid">{Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((option) => <label key={option}><input type="radio" name={name} value={option} checked={Number(value) === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>}
    {question.type === 'text' && <input type="text" maxLength={50} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="자유롭게 입력해주세요. (최대 50자)" />}
    {question.type === 'long' && <textarea rows="6" maxLength={500} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="자유롭게 서술해주세요. (최대 500자)" />}
    {error && <p id={errorId} className="question__error" role="alert">이 문항에 응답해주세요.</p>}
  </fieldset>
}
