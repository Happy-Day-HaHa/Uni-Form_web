export default function QuestionItem({ question, value, onChange, index }) {
  const name = `question-${question.id}`
  const number = String(index + 1).padStart(2, '0')

  return <fieldset className="question">
    <legend className="question__sr-legend">{number}. {question.title}</legend>
    <div className="question__heading" aria-hidden="true">
      <span>{number}</span>
      <strong>{question.title}</strong>
    </div>
    {question.type === 'single' && <div className="option-grid">{question.options.map((option) => <label key={option}><input type="radio" name={name} value={option} checked={value === option} onChange={(event) => onChange(event.target.value)} /><span>{option}</span></label>)}</div>}
    {question.type === 'scale' && <div className="scale-grid">{Array.from({ length: question.max - question.min + 1 }, (_, offset) => question.min + offset).map((option) => <label key={option}><input type="radio" name={name} value={option} checked={Number(value) === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>}
    {question.type === 'text' && <textarea rows="4" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="자유롭게 입력해주세요." />}
  </fieldset>
}
