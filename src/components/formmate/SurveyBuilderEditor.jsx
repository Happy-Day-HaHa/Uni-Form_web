import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getTomorrowKstDateString } from '../../utils/surveyPolicy'
import { estimatedMinutesError, getSelectRange, validateSelectRange } from '../../utils/validation'

export const QUESTION_TYPES = [
  ['single', '객관식', '하나만 선택'],
  ['multiple', '복수 선택', '여러 개 선택'],
  ['scale', '척도형', '1~5점'],
  ['text', '단답형', '짧은 글'],
  ['long', '장문형', '긴 글'],
]
const typeLabel = Object.fromEntries(QUESTION_TYPES.map(([value, label]) => [value, label]))

function formatDeadline(value) {
  if (!value) return ''
  const [, month, day] = value.split('-').map(Number)
  return `${month}월 ${day}일 마감`
}

// 목표 인원·마감일·카테고리·소요 시간. 다 채우면 접어서 한 줄 요약만 보이게 한다.
function SettingsBar({ form, onChange }) {
  const missingDeadline = !form.deadline
  const [open, setOpen] = useState(missingDeadline)
  const minutesError = estimatedMinutesError(form.estimatedMinutes)
  const summary = [
    form.targetCount ? `목표 ${form.targetCount}명` : null,
    formatDeadline(form.deadline),
    form.category,
    form.estimatedMinutes !== '' && form.estimatedMinutes != null ? `약 ${form.estimatedMinutes}분` : null,
  ].filter(Boolean)

  return <section className={`sb-settings${open ? ' is-open' : ''}`}>
    <button className="sb-settings__toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <b>설문 설정</b>
      <span className="sb-settings__summary">{summary.map((item) => <em key={item}>{item}</em>)}{missingDeadline && <em className="is-warning">마감일을 정해주세요</em>}</span>
      <i aria-hidden="true">{open ? '접기' : '펼치기'}</i>
    </button>
    {open && <div className="sb-settings__body">
      <label><span>목표 응답 인원 <em>*</em></span><div><input type="number" min="1" max="100" value={form.targetCount} onChange={(event) => onChange({ targetCount: event.target.value === '' ? '' : Number(event.target.value) })} /><small>명</small></div></label>
      <label><span>마감일 <em>*</em></span><div><input type="date" min={getTomorrowKstDateString()} required value={form.deadline || ''} onChange={(event) => onChange({ deadline: event.target.value })} /></div></label>
      <label><span>카테고리</span><div><input maxLength="20" value={form.category || ''} onChange={(event) => onChange({ category: event.target.value })} placeholder="예: 교육, 라이프스타일" /></div></label>
      <label><span>예상 소요 시간</span><div><input type="number" min="1" step="1" value={form.estimatedMinutes ?? ''} onChange={(event) => onChange({ estimatedMinutes: event.target.value === '' ? '' : Number(event.target.value) })} placeholder="예: 5" /><small>분</small></div></label>
      {minutesError && <p className="form-message form-message--error" role="alert">{minutesError}</p>}
      <footer><button type="button" onClick={() => setOpen(false)}>설정 완료</button></footer>
    </div>}
  </section>
}

// 복수 선택 문항의 최소/최대 선택 개수. 비워 두면 최소 1개, 최대 보기 수로 게시된다.
function SelectRange({ question, index, onQuestionChange }) {
  const optionCount = (question.options || []).length
  const error = validateSelectRange(question)
  const { min, max } = getSelectRange(question)
  const usesDefaults = (question.minSelect ?? null) === null && (question.maxSelect ?? null) === null
  const toValue = (value) => (value === '' ? null : Number(value))
  return <div className="sb-range">
    <label>최소<input type="number" min="1" max={optionCount} value={question.minSelect ?? ''} placeholder="1" onChange={(event) => onQuestionChange(question.id, { minSelect: toValue(event.target.value) })} aria-label={`${index + 1}번 문항 최소 선택 개수`} />개</label>
    <label>최대<input type="number" min="1" max={optionCount} value={question.maxSelect ?? ''} placeholder={String(optionCount)} onChange={(event) => onQuestionChange(question.id, { maxSelect: toValue(event.target.value) })} aria-label={`${index + 1}번 문항 최대 선택 개수`} />개 선택</label>
    {error ? <p className="form-message form-message--error" role="alert">{error}</p> : <small>{usesDefaults ? `비워 두면 1~${optionCount}개 선택으로 게시돼요.` : `응답자는 ${min}~${max}개를 고르게 돼요.`}</small>}
  </div>
}

// 기타(직접 입력) 보기: 명세 4.3·서버 규칙상 객관식(단일 선택)에만, 한 문항에 하나만 둘 수 있다.
// 화면 문항에서는 etcLabel과 라벨이 같은 보기가 기타 보기다. 새로 만들 때는 맨 끝에 두고, 일반 선택지는 그 앞에 끼운다.
const ETC_DEFAULT_LABEL = '기타'
const isEtcOption = (question, optionIndex) => question.type === 'single' && Boolean(question.etcLabel) && optionIndex === (question.options || []).lastIndexOf(question.etcLabel)

// 선택되지 않은 문항: 응답자에게 보일 모습 그대로 간단히 보여준다.
function QuestionSummary({ question }) {
  if (question.type === 'single' || question.type === 'multiple') {
    return <ul className={`sb-q__choices is-${question.type}`}>{(question.options || []).map((option, index) => <li key={`${option}-${index}`}><i aria-hidden="true" />{option || <span className="is-empty">빈 선택지</span>}{isEtcOption(question, index) && <span className="sb-etc-hint">직접 입력</span>}</li>)}</ul>
  }
  if (question.type === 'scale') return <div className="sb-q__scale"><span>{question.minLabel || '1점'}</span>{[1, 2, 3, 4, 5].map((point) => <b key={point}>{point}</b>)}<span>{question.maxLabel || '5점'}</span></div>
  return <div className={`sb-q__answer${question.type === 'long' ? ' is-long' : ''}`}>{question.type === 'long' ? '긴 답변' : '짧은 답변'}</div>
}

function QuestionEditor({ question, index, onQuestionChange }) {
  const hasOptions = question.type === 'single' || question.type === 'multiple'
  const options = question.options || []
  const etcIndex = options.findIndex((_, optionIndex) => isEtcOption(question, optionIndex))
  const hasEtc = etcIndex !== -1
  const canAddEtc = question.type === 'single' && !hasEtc && options.length < 10
  // 기타 보기 라벨을 고치면 etcLabel도 같이 바꿔 둘이 어긋나지 않게 한다.
  const setOption = (optionIndex, value) => onQuestionChange(question.id, { options: options.map((item, i) => (i === optionIndex ? value : item)), ...(optionIndex === etcIndex ? { etcLabel: value } : {}) })
  // 일반 선택지는 기타 보기 앞에 끼운다(기타는 항상 맨 끝).
  const insertAt = hasEtc ? etcIndex : options.length
  const addOption = () => onQuestionChange(question.id, { options: [...options.slice(0, insertAt), `선택 ${insertAt + 1}`, ...options.slice(insertAt)] })
  const removeOption = (optionIndex) => onQuestionChange(question.id, { options: options.filter((_, i) => i !== optionIndex), ...(optionIndex === etcIndex ? { etcLabel: null } : {}) })
  function addEtc() {
    const label = options.includes(ETC_DEFAULT_LABEL) ? `${ETC_DEFAULT_LABEL}(직접 입력)` : ETC_DEFAULT_LABEL
    onQuestionChange(question.id, { options: [...options, label], etcLabel: label })
  }
  const bodyRef = useRef(null)
  // 새로 만든 선택지처럼 아직 화면에 없는 칸은 그려진 다음에 포커스한다.
  const [pendingFocus, setPendingFocus] = useState(null)
  useEffect(() => {
    if (pendingFocus === null) return
    const input = bodyRef.current?.querySelectorAll('.sb-option input, .sb-scale-edit input')[pendingFocus]
    if (input) { input.focus(); input.select(); setPendingFocus(null) }
  }, [pendingFocus, options.length])
  const isEnter = (event) => event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing

  // 질문 입력 후 Enter: 선택지(척도는 1점 설명)로 넘어간다.
  function handleTitleKeyDown(event) {
    if (!isEnter(event)) return
    event.preventDefault()
    if (hasOptions || question.type === 'scale') setPendingFocus(0)
  }

  // 선택지에서 Enter: 다음 선택지로, 마지막이면 새 선택지를 만든다. 빈 선택지에서 Backspace: 지우고 위로.
  function handleOptionKeyDown(event, optionIndex) {
    if (isEnter(event)) {
      event.preventDefault()
      // 마지막 일반 선택지(기타 바로 앞 포함)에서 Enter면 새 선택지를 만든다. 기타 보기에서 Enter는 아무 일도 하지 않는다.
      if (optionIndex === etcIndex) return undefined
      if (optionIndex < insertAt - 1) return setPendingFocus(optionIndex + 1)
      if (options.length >= 10) return undefined
      addOption()
      return setPendingFocus(insertAt)
    }
    if (event.key === 'Backspace' && !options[optionIndex] && optionIndex !== etcIndex && options.length > 2) {
      event.preventDefault()
      removeOption(optionIndex)
      setPendingFocus(Math.max(0, optionIndex - 1))
    }
    return undefined
  }

  return <div className="sb-q__body" ref={bodyRef}>
    <div className="sb-q__edit-head">
      <input className="sb-q__title-input" maxLength="200" value={question.title} onChange={(event) => onQuestionChange(question.id, { title: event.target.value })} placeholder="질문을 입력해주세요." aria-label={`${index + 1}번 문항 질문`} autoFocus={!question.title} onKeyDown={handleTitleKeyDown} enterKeyHint="next" />
    </div>
    {hasOptions && <div className="sb-options">
      {options.map((option, optionIndex) => {
        const etc = optionIndex === etcIndex
        return <div className={`sb-option is-${question.type}${etc ? ' is-etc' : ''}`} key={`${question.id}-${optionIndex}`}>
          <i aria-hidden="true" />
          <input value={option} maxLength="50" onChange={(event) => setOption(optionIndex, event.target.value)} onKeyDown={(event) => handleOptionKeyDown(event, optionIndex)} enterKeyHint="next" placeholder={etc ? '기타' : `선택지 ${optionIndex + 1}`} aria-label={`${index + 1}번 문항 ${etc ? '기타(직접 입력) 보기' : `${optionIndex + 1}번째 선택지`}`} />
          {etc && <span className="sb-etc-hint">응답자가 직접 입력</span>}
          <button type="button" aria-label={etc ? '기타 보기 삭제' : '선택지 삭제'} title={etc ? '기타 보기 삭제' : '선택지 삭제'} disabled={options.length <= 2} onClick={() => removeOption(optionIndex)}>×</button>
        </div>
      })}
      <div className="sb-option-adds">
        {options.length < 10 && <button className="sb-option-add" type="button" onClick={addOption}>＋ 선택지 추가</button>}
        {canAddEtc && <button className="sb-option-add is-etc" type="button" onClick={addEtc}>＋ 기타(직접 입력) 추가</button>}
      </div>
    </div>}
    {question.type === 'multiple' && <SelectRange question={question} index={index} onQuestionChange={onQuestionChange} />}
    {question.type === 'scale' && <div className="sb-scale-edit">
      {/* [1점 문구] 1 2 3 4 5 [5점 문구] — 양 끝 문구는 그 자리에서 바로 고친다. */}
      <div className="sb-scale-edit__row">
        <input className="is-min" value={question.minLabel || ''} maxLength="50" onChange={(event) => onQuestionChange(question.id, { minLabel: event.target.value })} onKeyDown={(event) => { if (isEnter(event)) { event.preventDefault(); setPendingFocus(1) } }} enterKeyHint="next" placeholder="1점 문구" aria-label={`${index + 1}번 문항 1점 문구`} />
        <ol aria-hidden="true">{[1, 2, 3, 4, 5].map((point) => <li key={point}>{point}</li>)}</ol>
        <input className="is-max" value={question.maxLabel || ''} maxLength="50" onChange={(event) => onQuestionChange(question.id, { maxLabel: event.target.value })} placeholder="5점 문구" aria-label={`${index + 1}번 문항 5점 문구`} />
      </div>
      <small>양 끝 문구를 눌러 바꿀 수 있어요. 척도는 1~5점으로 고정돼요.</small>
    </div>}
    {(question.type === 'text' || question.type === 'long') && <div className={`sb-q__answer${question.type === 'long' ? ' is-long' : ''}`}>응답자가 여기에 {question.type === 'long' ? '긴' : '짧은'} 답변을 입력해요.</div>}
  </div>
}

// 문항 순서가 바뀌면 각 카드를 원래 자리에서 새 자리로 미끄러지게 한다(FLIP). 내용 편집으로 높이만 바뀔 때는 움직이지 않는다.
function useReorderAnimation(listRef, order) {
  const positions = useRef(new Map())
  const previousOrder = useRef(order)
  useLayoutEffect(() => {
    const items = [...(listRef.current?.children || [])]
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (previousOrder.current !== order && !reduceMotion) {
      items.forEach((item) => {
        const before = positions.current.get(item.dataset.qid)
        if (before === undefined) return
        const offset = before - (item.getBoundingClientRect().top + window.scrollY)
        if (Math.abs(offset) > 1) item.animate([{ transform: `translateY(${offset}px)` }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
      })
    }
    previousOrder.current = order
    positions.current = new Map(items.map((item) => [item.dataset.qid, item.getBoundingClientRect().top + window.scrollY]))
  })
}

// 드래그 중 손가락/마우스가 화면 위/아래 끝에 가까우면 자동으로 스크롤한다. 끝에 가까울수록 빠르다.
// 위쪽 기준선은 상단에 붙어 있는 작업 줄(.sb-toolbar)의 아래쪽이다. 스크롤하면 onScroll로 놓일 자리를 다시 계산한다.
const AUTO_SCROLL_EDGE = 90
const AUTO_SCROLL_MAX_SPEED = 18
function useDragAutoScroll(active, pointerYRef, onScroll) {
  useEffect(() => {
    if (!active) return undefined
    let frame = 0
    function step() {
      const pointerY = pointerYRef.current
      if (pointerY !== null) {
        const top = document.querySelector('.sb-toolbar')?.getBoundingClientRect().bottom ?? 0
        const ratio = (distance) => Math.min(1, Math.max(0, 1 - distance / AUTO_SCROLL_EDGE))
        const speed = pointerY < top + AUTO_SCROLL_EDGE ? -ratio(pointerY - top) : pointerY > window.innerHeight - AUTO_SCROLL_EDGE ? ratio(window.innerHeight - pointerY) : 0
        if (speed) { window.scrollBy(0, speed * AUTO_SCROLL_MAX_SPEED); onScroll() }
      }
      frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [active, pointerYRef, onScroll])
}

export default function SurveyBuilderEditor({ form, onChange, onQuestionChange, onAddQuestion, onDeleteQuestion, onReorderQuestion, selectedQuestionId, onSelectQuestion, highlightKeys = [] }) {
  const flash = (key) => (highlightKeys.includes(key) ? ' is-auto-updated' : '')
  const count = form.questions.length
  const listRef = useRef(null)
  useReorderAnimation(listRef, form.questions.map((question) => question.id).join(','))

  // 순서 바꾸기: 손잡이(⠿)를 마우스나 손가락으로 잡고 끈다(포인터 이벤트라 터치에서도 동작).
  // 4px 넘게 움직여야 드래그로 보고, 놓일 자리에 파란 선을 보여준다. dropIndex는 "몇 번째 앞에 끼울지"(0~count).
  const [dragId, setDragId] = useState('')
  const [dropIndex, setDropIndex] = useState(null)
  const dragRef = useRef(null)
  const dropIndexRef = useRef(null)
  const pointerYRef = useRef(null)
  const justDraggedRef = useRef(false)
  const dragIndex = form.questions.findIndex((question) => question.id === dragId)

  function findDropIndex(pointerY) {
    const cards = [...(listRef.current?.children || [])]
    const index = cards.findIndex((card) => { const box = card.getBoundingClientRect(); return pointerY < box.top + box.height / 2 })
    return index === -1 ? cards.length : index
  }
  // ref와 state setter만 쓰므로 첫 렌더의 함수를 계속 써도 된다(자동 스크롤 훅에 고정된 함수로 넘김).
  function refreshDrop() {
    if (pointerYRef.current === null || !dragRef.current?.moved) return
    const next = findDropIndex(pointerYRef.current)
    dropIndexRef.current = next
    setDropIndex(next)
  }
  const onAutoScroll = useRef(refreshDrop).current
  useDragAutoScroll(Boolean(dragId), pointerYRef, onAutoScroll)

  function handlePointerDown(event, id) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    // 손잡이 밖으로 나가도 계속 이벤트를 받도록 포인터를 붙잡는다(지원 안 되는 경우는 그냥 진행).
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* 무시 */ }
    dragRef.current = { id, startY: event.clientY, moved: false }
    pointerYRef.current = event.clientY
  }
  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    pointerYRef.current = event.clientY
    if (!drag.moved) {
      if (Math.abs(event.clientY - drag.startY) < 4) return
      drag.moved = true
      setDragId(drag.id)
    }
    refreshDrop()
  }
  function finishDrag(commit) {
    const drag = dragRef.current
    dragRef.current = null
    pointerYRef.current = null
    if (drag?.moved) {
      justDraggedRef.current = true
      const from = form.questions.findIndex((question) => question.id === drag.id)
      const to = dropIndexRef.current
      // 자기 바로 앞/뒤에 놓으면 제자리라 아무것도 하지 않는다.
      if (commit && to !== null && from !== -1 && to !== from && to !== from + 1) onReorderQuestion(drag.id, to > from ? to - 1 : to)
    }
    dropIndexRef.current = null
    setDragId('')
    setDropIndex(null)
  }

  return <div className="sb-editor">
    <header className="sb-doc-head">
      <input className={`sb-doc-head__title${flash('title')}`} maxLength="100" value={form.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="설문 제목을 입력해주세요" aria-label="설문 제목" />
      <textarea className={`sb-doc-head__desc${flash('description')}`} maxLength="200" rows="2" value={form.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="응답자에게 보여줄 설명을 적어주세요 (선택)" aria-label="설문 설명" />
    </header>

    <SettingsBar form={form} onChange={onChange} />

    {count === 0 && <p className="sb-empty">아래에서 첫 문항의 유형을 골라 추가해보세요. FormMate에게 만들어 달라고 해도 돼요.</p>}
    <ol className={`sb-questions${dragId ? ' is-dragging' : ''}`} aria-label="설문 문항" ref={listRef}>
      {form.questions.map((question, index) => {
        const active = question.id === selectedQuestionId
        const dropClass = dragId && dropIndex === index && index !== dragIndex && index !== dragIndex + 1 ? ' is-drop-before' : dragId && dropIndex === count && index === count - 1 && dragIndex !== count - 1 ? ' is-drop-after' : ''
        return <li key={question.id} data-qid={question.id} className={`sb-q${active ? ' is-active' : ''}${question.id === dragId ? ' is-dragged' : ''}${dropClass}`} onClick={() => { if (justDraggedRef.current) { justDraggedRef.current = false; return } if (!active) onSelectQuestion(question.id) }} onFocus={() => !active && onSelectQuestion(question.id)}>
          <div className="sb-q__meta"><span className="sb-q__handle" onPointerDown={(event) => handlePointerDown(event, question.id)} onPointerMove={handlePointerMove} onPointerUp={() => finishDrag(true)} onPointerCancel={() => finishDrag(false)} title="끌어서 순서 바꾸기" aria-hidden="true">⠿</span><b>Q{index + 1}</b><span>{typeLabel[question.type] || question.type}</span>
            {/* 선택된 문항은 필수 토글·삭제를 맨 위 줄에 둔다(카드 아래 도구 줄 없이 작게) */}
            {active
              ? <div className="sb-q__actions"><label className="sb-switch"><input type="checkbox" checked={question.required !== false} onChange={(event) => onQuestionChange(question.id, { required: event.target.checked })} /><i aria-hidden="true" /><span>필수</span></label><button type="button" className="sb-q__delete" onClick={() => onDeleteQuestion(question.id)}>삭제</button></div>
              : question.required !== false && <em>필수</em>}
          </div>
          {active
            ? <QuestionEditor question={question} index={index} onQuestionChange={onQuestionChange} />
            : <><p className={`sb-q__title${question.title ? '' : ' is-empty'}`}>{question.title || '질문을 입력해주세요.'}</p><QuestionSummary question={question} /></>}
        </li>
      })}
    </ol>

    <div className="sb-add">
      <span>문항 추가</span>
      <div>{QUESTION_TYPES.map(([value, label, hint]) => <button key={value} type="button" disabled={count >= 30} onClick={() => onAddQuestion(value)}><b>＋ {label}</b><small>{hint}</small></button>)}</div>
      {count >= 30 && <small>문항은 최대 30개까지 만들 수 있어요.</small>}
    </div>
  </div>
}
