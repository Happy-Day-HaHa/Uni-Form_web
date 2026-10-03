import { useEffect, useRef, useState } from 'react'
import LoadingState from '../components/LoadingState'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FormMatePanel from '../components/formmate/FormMatePanel'
import SurveyBuilderEditor from '../components/formmate/SurveyBuilderEditor'
import Modal from '../components/Modal'
import ServiceShell from '../components/ServiceShell'
import { DEFAULT_SCALE_LABELS } from '../services/surveyService'
import { useSmoothFollow } from '../hooks/useSmoothFollow'
import { useSurveyDraft } from '../hooks/useSurveyDraft'
import { listSurveyIssues, validateSurvey } from '../utils/validation'
import '../styles/survey-builder.css'

const blankQuestion = (type = 'text') => ({ id: crypto.randomUUID(), title: '', type, required: true, options: (type === 'single' || type === 'multiple') ? ['선택 1', '선택 2'] : [], ...(type === 'scale' ? { min: 1, max: 5, minLabel: DEFAULT_SCALE_LABELS.min, maxLabel: DEFAULT_SCALE_LABELS.max } : {}) })
const initialMessages = [{ role: 'assistant', text: '안녕하세요. 어떤 설문을 만들고 싶으신가요?' }]
const questionTypeLabels = { single: '단일 선택', multiple: '복수 선택', scale: '척도형', text: '단답형', long: '장문형' }
const AUTO_UPDATE_HIGHLIGHT_MS = 1800
const FORMMATE_OPEN_KEY = 'uniform-formmate-open'
const isNarrow = () => window.matchMedia('(max-width: 900px)').matches
// FormMate 패널이 멈춰 설 위치: 상단바(64px) + 작업 줄 높이 + 여백
const formMateTopOffset = () => 64 + (document.querySelector('.sb-toolbar')?.offsetHeight ?? 66) + 16

// "제목을 X로/으로" — 마지막 글자의 받침으로 조사를 고른다(받침 없음·ㄹ받침은 '로').
function withRo(text) {
  const code = text.trim().charCodeAt(text.trim().length - 1) - 0xac00
  const coda = code >= 0 && code <= 11171 ? code % 28 : 0
  return `"${text}"${coda === 0 || coda === 8 ? '로' : '으로'}`
}
function shorten(text, max = 40) { return text.length > max ? `${text.slice(0, max)}…` : text }

// FormMate가 이번 답변에서 바로 바꾼 제목/설명을 채팅에 짧게 알린다.
function autoUpdateNotices({ updatedTitle, updatedDescription }) {
  const notices = []
  if (updatedTitle !== undefined) notices.push(`제목을 ${withRo(shorten(updatedTitle))} 설정했어요.`)
  if (updatedDescription !== undefined) notices.push(updatedDescription ? `설명을 ${withRo(shorten(updatedDescription))} 설정했어요.` : '설명을 비웠어요.')
  return notices
}

function FormMatePreview({ form, highlightKeys = [] }) {
  const flash = (key) => highlightKeys.includes(key) ? ' is-auto-updated' : ''
  const questions = form.questions.filter((question) => question.title.trim())
  const visibleQuestions = questions.length ? questions : form.questions
  return <div className="formmate-preview-body">
    <header className="formmate-preview-intro" data-preview-key="title"><h3 className={flash('title').trim() || undefined}>{form.title || '설문 제목을 입력해주세요.'}</h3><p data-preview-key="description" className={flash('description').trim() || undefined}>{form.description || '설문에 대한 설명을 입력해주세요.'}</p><div data-preview-key="basic">{form.category && <span>{form.category}</span>}{form.estimatedMinutes !== '' && form.estimatedMinutes != null && <span>약 {Number(form.estimatedMinutes)}분</span>}<span>{visibleQuestions.length}개 문항</span>{form.deadline && <span>{form.deadline} 마감</span>}</div></header>
    <div className="formmate-preview-questions">{visibleQuestions.map((question, index) => {
      const options = question.type === 'scale' ? Array.from({ length: Number(question.max || 5) - Number(question.min || 1) + 1 }, (_, offset) => Number(question.min || 1) + offset) : question.options || []
      return <fieldset key={question.id} data-preview-key={`question-${question.id}`}><legend><b>Q{index + 1}.</b> {question.title || '질문을 입력해주세요.'}{question.required !== false && <em>*</em>}<small>{questionTypeLabels[question.type] || question.type}</small></legend>{question.type === 'text' || question.type === 'long' ? <textarea readOnly rows={question.type === 'long' ? 3 : 1} placeholder="답변을 입력해주세요." /> : options.map((option) => <label key={option}><input type={question.type === 'multiple' ? 'checkbox' : 'radio'} name={`preview-${question.id}`} disabled /> <span>{option}</span></label>)}</fieldset>
    })}</div>
  </div>
}

export default function SurveyCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  // ?draft=<id>로 들어오면 그 초안을 이어서 편집한다(API 모드). 처음 값만 쓴다.
  const [initialDraftId] = useState(() => searchParams.get('draft') || '')
  const initialPrompt = location.state?.formMatePrompt || ''
  // 카테고리·예상 소요시간은 선택 입력이라 비워 둔다(비우면 null로 저장).
  const [form, setForm] = useState({ title: '', description: '', category: '', targetCount: '', estimatedMinutes: '', deadline: '', questions: [] })
  const [aiPrompt, setAiPrompt] = useState(initialPrompt)
  const [aiStep, setAiStep] = useState(0)
  const [aiMessages, setAiMessages] = useState(initialMessages)
  const [aiMessage, setAiMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [respondentPreviewOpen, setRespondentPreviewOpen] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [history, setHistory] = useState([])
  // FormMate 패널: PC는 마지막 상태를 기억하고(기본 열림), 좁은 화면은 닫힌 채로 시작한다.
  const [narrow, setNarrow] = useState(isNarrow)
  const formMateColumnRef = useRef(null)
  const formMatePanelRef = useRef(null)
  const [formMateOpen, setFormMateOpen] = useState(() => {
    if (isNarrow()) return Boolean(initialPrompt)
    try { return localStorage.getItem(FORMMATE_OPEN_KEY) !== '0' } catch { return true }
  })
  // FormMate가 방금 자동으로 바꾼 필드(title/description) — 잠깐 강조해 바뀐 곳을 알려준다.
  const [autoUpdatedKeys, setAutoUpdatedKeys] = useState([])
  const selectedIndex = form.questions.findIndex((item) => item.id === selectedQuestionId)
  const draft = useSurveyDraft({
    enabled: true,
    form,
    setForm,
    initialDraftId,
    onDraftCreated: (id) => setSearchParams({ draft: id }, { replace: true }),
    onConflict: (mine) => {
      setHistory((past) => [...past.slice(-9), { form: mine }])
      setMessage('다른 곳에서 먼저 저장되어 최신 내용으로 바꿨어요. "마지막 변경 되돌리기"를 누르면 내 편집을 다시 적용합니다.')
    },
  })

  useEffect(() => {
    if (!autoUpdatedKeys.length) return undefined
    const timer = window.setTimeout(() => setAutoUpdatedKeys([]), AUTO_UPDATE_HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
  }, [autoUpdatedKeys])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const sync = () => setNarrow(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  // PC에서는 FormMate 패널이 스크롤을 부드럽게 따라온다(좁은 화면은 서랍이라 제외).
  useSmoothFollow(formMateColumnRef, formMatePanelRef, { getTopOffset: formMateTopOffset, disabled: narrow || !formMateOpen })

  function toggleFormMate(next) {
    const value = typeof next === 'boolean' ? next : !formMateOpen
    setFormMateOpen(value)
    if (!isNarrow()) { try { localStorage.setItem(FORMMATE_OPEN_KEY, value ? '1' : '0') } catch { /* 저장 못 해도 동작에는 지장 없음 */ } }
  }

  function commitForm(updater) {
    setHistory((past) => [...past.slice(-9), { form }])
    setForm((current) => typeof updater === 'function' ? updater(current) : { ...current, ...updater })
  }

  function setChangeStatus(messageIndex, changeIds, status) {
    setAiMessages((current) => current.map((item, index) => index !== messageIndex ? item : { ...item, changes: item.changes.map((change) => changeIds.includes(change.id) ? { ...change, status } : change) }))
  }

  async function handleApplyChanges(messageIndex, changeIds) {
    if (applying) return
    setApplying(true)
    setAiMessage('')
    try {
      await draft.applyChanges(changeIds)
      setHistory((past) => [...past.slice(-9), { form, changeIds, messageIndex }])
      setChangeStatus(messageIndex, changeIds, 'applied')
      setAiMessage('선택한 제안을 설문에 반영했어요.')
    } catch (error) {
      setAiMessage(error.message)
    } finally {
      setApplying(false)
    }
  }

  async function handleRevertChanges(messageIndex, changeIds) {
    if (applying) return
    setApplying(true)
    setAiMessage('')
    try {
      await draft.applyChanges(changeIds, { revert: true })
      setHistory((past) => past.filter((entry) => !entry.changeIds?.some((id) => changeIds.includes(id))))
      setChangeStatus(messageIndex, changeIds, 'reverted')
      setAiMessage('적용했던 제안을 되돌렸어요.')
    } catch (error) {
      setAiMessage(error.message)
    } finally {
      setApplying(false)
    }
  }

  // 마지막 변경 되돌리기: FormMate 제안이면 서버에서 revert, 직접 편집이면 이전 form으로 돌린다(자동 저장됨).
  function handleUndo() {
    const previous = history.at(-1)
    if (!previous) return
    if (previous.changeIds) return handleRevertChanges(previous.messageIndex, previous.changeIds)
    setForm(previous.form)
    setHistory((past) => past.slice(0, -1))
    setMessage('')
    setAiMessage('마지막 변경을 되돌렸어요.')
  }

  function updateQuestion(id, patch) {
    commitForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }))
  }

  function addQuestion(type) {
    const question = blankQuestion(type)
    commitForm((current) => ({ ...current, questions: [...current.questions, question] }))
    setSelectedQuestionId(question.id)
  }

  function deleteQuestion(id) {
    const index = form.questions.findIndex((item) => item.id === id)
    commitForm((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) }))
    setSelectedQuestionId(form.questions[index + 1]?.id || form.questions[index - 1]?.id || '')
  }

  function reorderQuestion(id, toIndex) {
    commitForm((current) => {
      const questions = current.questions.filter((item) => item.id !== id)
      questions.splice(toIndex, 0, current.questions.find((item) => item.id === id))
      return { ...current, questions }
    })
  }

  // 문항 카드 바깥(여백)을 누르거나 Esc를 누르면 선택을 푼다. FormMate 패널·모달 안을 누를 때는 유지한다(선택 문항이 FormMate 요청 대상이라서).
  useEffect(() => {
    if (!selectedQuestionId) return undefined
    function handlePointerDown(event) {
      if (event.target.closest?.('.sb-q, .sb-formmate, .sb-formmate-backdrop, .modal-backdrop')) return
      setSelectedQuestionId('')
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !document.querySelector('.modal-backdrop')) setSelectedQuestionId('')
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown); document.removeEventListener('keydown', handleKeyDown) }
  }, [selectedQuestionId])

  async function sendToFormMate(value) {
    const selected = form.questions[selectedIndex]
    const text = selected ? `[Q${selectedIndex + 1} "${selected.title || '제목 없는 문항'}"에 대해] ${value}` : value
    setAiMessages((current) => [...current, { role: 'user', text: value }])
    setAiPrompt('')
    setAiMessage('')
    setApplying(true)
    try {
      const reply = await draft.sendMessage(text)
      const { aiReply, proposedChanges } = reply
      setAiMessages((current) => [...current, { role: 'assistant', text: aiReply, notices: autoUpdateNotices(reply), changes: proposedChanges.map((change) => ({ ...change, status: 'pending' })) }])
      const updatedKeys = [reply.updatedTitle !== undefined && 'title', reply.updatedDescription !== undefined && 'description'].filter(Boolean)
      if (updatedKeys.length) setAutoUpdatedKeys(updatedKeys)
      setAiStep((step) => step + 1)
      if (proposedChanges.length) setAiMessage('적용할 제안을 골라주세요.')
    } catch (error) {
      setAiMessages((current) => [...current, { role: 'assistant', text: `요청을 처리하지 못했어요. ${error.message}` }])
    } finally {
      setApplying(false)
    }
  }

  function handleAgentSend(rawValue) {
    const value = rawValue.trim()
    if (value.length < 2 || applying) return setAiMessage('조금 더 구체적으로 입력해주세요.')
    return sendToFormMate(value)
  }

  async function handleSubmit(event) {
    event?.preventDefault()
    setMessage('')
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount, deadline: form.deadline, estimatedMinutes: form.estimatedMinutes })
    if (validationMessage) return setMessage(validationMessage)
    try {
      setSubmitting(true)
      await draft.publish()
      navigate('/surveys')
    } catch (error) {
      setMessage(error.messages?.length > 1 ? error.messages.join(' · ') : error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filledCount = form.questions.filter((question) => question.title.trim()).length
  // 게시 확인 창을 열었을 때만 점검한다.
  const publishIssues = previewOpen ? listSurveyIssues(form) : []
  return <ServiceShell activePath="/formmate"><div className="create-saas formmate-page sb-page motion-page">
    <header className="sb-toolbar">
      <div className="sb-toolbar__title"><h1>설문 만들기</h1><span>{draft.saveStatus || '작성을 시작하면 자동 저장돼요'}</span></div>
      <div className="sb-toolbar__actions">
        <button className="sb-btn" type="button" onClick={() => setRespondentPreviewOpen(true)}>미리보기</button>
        <button className={`sb-btn sb-btn--formmate${formMateOpen ? ' is-on' : ''}`} type="button" aria-pressed={formMateOpen} onClick={() => toggleFormMate()}><span aria-hidden="true">✦</span> FormMate</button>
        <button className="sb-btn" type="button" onClick={() => draft.flush().catch(() => {})}>임시 저장</button>
        <button className="sb-btn sb-btn--primary" type="button" onClick={() => setPreviewOpen(true)}>설문 등록하기</button>
      </div>
    </header>
    <div className={`sb-layout${formMateOpen ? ' has-formmate' : ''}`}>
      <main className="sb-canvas">
        {(message || draft.error) && <p className="form-message form-message--error sb-canvas__error">{message || draft.error}</p>}
        {draft.loading ? <LoadingState>초안을 불러오고 있어요.</LoadingState> : <SurveyBuilderEditor form={form} onChange={(patch) => commitForm(patch)} onQuestionChange={updateQuestion} onAddQuestion={addQuestion} onDeleteQuestion={deleteQuestion} onReorderQuestion={reorderQuestion} selectedQuestionId={selectedQuestionId} onSelectQuestion={setSelectedQuestionId} highlightKeys={autoUpdatedKeys} />}
      </main>
      {formMateOpen && <button className="sb-formmate-backdrop" type="button" aria-label="FormMate 닫기" onClick={() => toggleFormMate(false)} />}
      {formMateOpen && <div className="sb-formmate-col" ref={formMateColumnRef}><div className="sb-formmate" ref={formMatePanelRef}>
        <header><div><b><span aria-hidden="true">✦</span> FormMate</b><small>원하는 설문을 말하면 문항을 제안해요</small></div><button type="button" aria-label="FormMate 닫기" title="닫기" onClick={() => toggleFormMate(false)}>×</button></header>
        <FormMatePanel value={aiPrompt} onChange={setAiPrompt} onSend={handleAgentSend} onUndo={handleUndo} onApplyChanges={handleApplyChanges} onRevertChanges={handleRevertChanges} busyLabel="FormMate가 작업하고 있어요." canUndo={history.length > 0 && !applying} selectedLabel={selectedIndex >= 0 ? `Q${selectedIndex + 1} 선택됨` : ''} messages={aiMessages} message={aiMessage} applying={applying} suggestions={[]} draftSummary={aiStep > 0 ? { title: form.title, count: filledCount || form.questions.length, minutes: form.estimatedMinutes, onOpen: () => window.scrollTo({ top: 0, behavior: 'smooth' }) } : null} />
      </div></div>}
    </div>
  </div><Modal open={respondentPreviewOpen} title="응답자 화면 미리보기" onClose={() => setRespondentPreviewOpen(false)}><div className="sb-respondent-preview"><FormMatePreview form={form} /></div></Modal><Modal open={previewOpen} title="설문을 게시할까요?" onClose={() => setPreviewOpen(false)}><div className="survey-preview-list"><p><b>{form.title || '제목 없는 설문'}</b><br />{form.questions.filter((question) => question.title.trim()).length}개 문항{form.estimatedMinutes ? ` · 약 ${form.estimatedMinutes}분` : ''}{form.category ? ` · ${form.category}` : ''} · 목표 {form.targetCount ? `${form.targetCount}명` : '미정'}</p>{form.questions.filter((question) => question.title.trim()).map((question, index) => <div key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{question.title}</b></div>)}</div>{publishIssues.length > 0 && <div className="sb-publish-issues" role="alert"><b>아직 게시할 수 없어요</b><p>아래 항목을 고치면 게시할 수 있어요.</p><ul>{publishIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}<ul className="publish-notices"><li>게시 후에는 설문 내용과 마감일을 수정할 수 없어요.</li><li>마감 30일 후 설문 원문은 파기돼요.</li><li>금지 내용을 포함한 설문은 운영자가 삭제할 수 있어요.</li></ul><div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setPreviewOpen(false)}>편집 계속하기</button><button className="ui-button" type="button" disabled={submitting || publishIssues.length > 0} onClick={handleSubmit}>{submitting ? '게시 중…' : '설문 게시하기'}</button></div></Modal></ServiceShell>
}
