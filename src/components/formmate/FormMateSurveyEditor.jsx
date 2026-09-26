import { getTomorrowKstDateString } from '../../utils/surveyPolicy'
import { getSelectRange, validateSelectRange } from '../../utils/validation'

const questionTypes = [
  ['single', '객관식 (단일선택)'],
  ['multiple', '객관식 (복수선택)'],
  ['scale', '척도형'],
  ['text', '단답형'],
  ['long', '장문형'],
]

function optionLabel(index) {
  return `선택지 ${index + 1}`
}

// 복수선택 문항의 최소/최대 선택 개수. 비워 두면 기본값(최소 1개, 최대 보기 수)으로 게시된다.
function SelectRangeFields({ question, questionIndex, onQuestionChange }) {
  const optionCount = (question.options || []).length
  const error = validateSelectRange(question)
  const { min, max } = getSelectRange(question)
  const usesDefaults = (question.minSelect ?? null) === null && (question.maxSelect ?? null) === null
  const toValue = (value) => (value === '' ? null : Number(value))
  return <div className="formmate-select-range">
    <label><span>최소 선택</span><input type="number" min="1" max={optionCount} value={question.minSelect ?? ''} placeholder="1" onChange={(event) => onQuestionChange(question.id, { minSelect: toValue(event.target.value) })} aria-label={`${questionIndex + 1}번 문항 최소 선택 개수`} /><small>개</small></label>
    <label><span>최대 선택</span><input type="number" min="1" max={optionCount} value={question.maxSelect ?? ''} placeholder={String(optionCount)} onChange={(event) => onQuestionChange(question.id, { maxSelect: toValue(event.target.value) })} aria-label={`${questionIndex + 1}번 문항 최대 선택 개수`} /><small>개</small></label>
    {error ? <p className="form-message form-message--error" role="alert">{error}</p> : <p className="formmate-select-range__hint">{usesDefaults ? `비워 두면 최소 1개, 최대 ${optionCount}개(보기 수)로 게시돼요.` : `응답자는 ${min}~${max}개를 선택하게 돼요.`}</p>}
  </div>
}

export default function FormMateSurveyEditor({
  form,
  onChange,
  onQuestionChange,
  onAddQuestion,
  onDeleteQuestion,
  selectedQuestionId,
  onSelectQuestion,
}) {
  const questionCount = form.questions.length
  const activeIndex = Math.max(0, form.questions.findIndex((question) => question.id === selectedQuestionId))

  function updateOption(question, index, value) {
    const options = [...(question.options || [])]
    options[index] = value
    onQuestionChange(question.id, { options })
  }

  function addOption(question) {
    const options = question.options || []
    if (options.length >= 10) return
    onQuestionChange(question.id, { options: [...options, optionLabel(options.length)] })
  }

  function removeOption(question, index) {
    const options = question.options || []
    if (options.length <= 2) return
    onQuestionChange(question.id, { options: options.filter((_, optionIndex) => optionIndex !== index) })
  }

  return <div className="formmate-inline-editor">
    <section className="formmate-editor-meta" aria-label="설문 기본 정보">
      <div className="formmate-editor-field" data-editor-key="title"><header><span>01</span><b>설문 제목 <em>*</em></b></header><label><span><input maxLength="100" value={form.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="설문 제목을 입력해주세요." /><small>{form.title.length}/100</small></span></label></div>
      <div className="formmate-editor-field" data-editor-key="description"><header><span>02</span><b>설문 설명</b></header><label><span><input maxLength="200" value={form.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="설문에 대한 설명을 입력해주세요." /><small>{form.description.length}/200</small></span></label></div>
      <div className="formmate-editor-field" data-editor-key="basic"><header><span>03</span><b>기본 정보</b></header><div className="formmate-editor-basic"><label><b>목표 응답 인원</b><span><input type="number" min="1" max="100" value={form.targetCount} onChange={(event) => onChange({ targetCount: Number(event.target.value) })} /><small>명</small></span></label><label><b>마감일</b><span><input type="date" min={getTomorrowKstDateString()} required value={form.deadline || ''} onChange={(event) => onChange({ deadline: event.target.value })} /></span></label></div></div>
    </section>

    <section className="formmate-editor-section" aria-label="설문 문항 편집" data-editor-key="questions">
      <header className="formmate-editor-toolbar">
        <div><b>04</b><h3>설문 문항</h3><span>{questionCount}개 문항</span></div>
        <div className="formmate-editor-progress" aria-label={`${questionCount}개 문항 중 ${activeIndex + 1}번째 문항`}><i><span style={{ width: `${questionCount ? ((activeIndex + 1) / questionCount) * 100 : 0}%` }} /></i><b>{questionCount ? activeIndex + 1 : 0} / {questionCount}</b></div>
        <button type="button" onClick={onAddQuestion} disabled={questionCount >= 30}>＋ 질문 추가</button>
        <button type="button" aria-label="문항 메뉴">•••</button>
      </header>

      <div className="formmate-edit-list">
        {form.questions.map((question, questionIndex) => {
          const hasOptions = question.type === 'single' || question.type === 'multiple'
          return <article className={`formmate-edit-question ${selectedQuestionId === question.id ? 'is-selected' : ''}`} key={question.id} data-editor-key={`question-${question.id}`} onFocus={() => onSelectQuestion(question.id)} onClick={() => onSelectQuestion(question.id)}>
            <div className="formmate-edit-question__index"><b>Q{questionIndex + 1}</b><span aria-hidden="true">⠿</span></div>
            <div className="formmate-edit-question__body">
              <label className="formmate-edit-question__title"><input maxLength="200" value={question.title} onChange={(event) => onQuestionChange(question.id, { title: event.target.value })} placeholder="질문을 입력해주세요." /><small>{question.title.length}/200</small></label>
              <div className="formmate-edit-question__controls">
                <label><span className="sr-only">문항 유형</span><select value={question.type} onChange={(event) => onQuestionChange(question.id, { type: event.target.value })}>{questionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="formmate-required-toggle"><input type="checkbox" checked={question.required !== false} onChange={(event) => onQuestionChange(question.id, { required: event.target.checked })} /><i /><span>필수</span></label>
                <button type="button" className="formmate-question-delete" aria-label={`${questionIndex + 1}번 문항 삭제`} disabled={questionCount <= 1} onClick={() => onDeleteQuestion(question.id)}>⌫</button>
              </div>
              {hasOptions && <div className="formmate-option-list">
                {(question.options || []).map((option, optionIndex) => <div className="formmate-option-row" key={`${question.id}-${optionIndex}`}><span aria-hidden="true">⠿</span><input value={option} maxLength="50" onChange={(event) => updateOption(question, optionIndex, event.target.value)} aria-label={`${questionIndex + 1}번 문항 ${optionIndex + 1}번째 선택지`} /><button type="button" aria-label="선택지 수정" onClick={(event) => event.currentTarget.previousElementSibling?.focus()}>✎</button><button type="button" aria-label="선택지 삭제" disabled={(question.options || []).length <= 2} onClick={() => removeOption(question, optionIndex)}>♲</button></div>)}
                <button className="formmate-option-add" type="button" onClick={() => addOption(question)} disabled={(question.options || []).length >= 10}>＋ 선택지 추가</button>
              </div>}
              {question.type === 'multiple' && <SelectRangeFields question={question} questionIndex={questionIndex} onQuestionChange={onQuestionChange} />}
              {question.type === 'scale' && <div className="formmate-scale-options"><strong>1</strong><span>—</span><strong>5</strong><small>척도는 1~5로 고정됩니다.</small></div>}
              {question.type === 'scale' && <div className="formmate-option-list">
                <div className="formmate-option-row"><span aria-hidden="true">1</span><input value={question.minLabel || ''} maxLength="50" onChange={(event) => onQuestionChange(question.id, { minLabel: event.target.value })} placeholder="1점의 의미 (예: 전혀 그렇지 않다)" aria-label={`${questionIndex + 1}번 문항 1점 설명`} /></div>
                <div className="formmate-option-row"><span aria-hidden="true">5</span><input value={question.maxLabel || ''} maxLength="50" onChange={(event) => onQuestionChange(question.id, { maxLabel: event.target.value })} placeholder="5점의 의미 (예: 매우 그렇다)" aria-label={`${questionIndex + 1}번 문항 5점 설명`} /></div>
              </div>}
              {(question.type === 'text' || question.type === 'long') && <div className="formmate-answer-placeholder">응답자가 여기에 답변을 입력합니다.</div>}
            </div>
          </article>
        })}
      </div>
    </section>
  </div>
}
