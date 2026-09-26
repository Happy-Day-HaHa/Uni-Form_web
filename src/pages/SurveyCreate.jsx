import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FormMatePanel from '../components/formmate/FormMatePanel'
import FormMateSurveyEditor from '../components/formmate/FormMateSurveyEditor'
import Modal from '../components/Modal'
import ServiceShell from '../components/ServiceShell'
import { isApiConfigured } from '../services/apiClient'
import { createSurvey, DEFAULT_SCALE_LABELS } from '../services/surveyService'
import { useSurveyDraft } from '../hooks/useSurveyDraft'
import { validateSurvey } from '../utils/validation'

const blankQuestion = (type = 'text') => ({ id: crypto.randomUUID(), title: '', type, required: true, options: (type === 'single' || type === 'multiple') ? ['선택 1', '선택 2'] : [], ...(type === 'scale' ? { min: 1, max: 5, minLabel: DEFAULT_SCALE_LABELS.min, maxLabel: DEFAULT_SCALE_LABELS.max } : {}) })
const initialMessages = [{ role: 'assistant', text: '안녕하세요. 어떤 설문을 만들고 싶으신가요?' }]
const questionTypeLabels = { single: '단일 선택', multiple: '복수 선택', scale: '척도형', text: '단답형', long: '장문형' }
function FormMatePreview({ form }) {
  const questions = form.questions.filter((question) => question.title.trim())
  const visibleQuestions = questions.length ? questions : form.questions
  return <div className="formmate-preview-body">
    <header className="formmate-preview-intro" data-preview-key="title"><h3>{form.title || '설문 제목을 입력해주세요.'}</h3><p data-preview-key="description">{form.description || '설문에 대한 설명을 입력해주세요.'}</p><div data-preview-key="basic"><span>약 {Number(form.estimatedMinutes || 1)}분</span><span>{visibleQuestions.length}개 문항</span>{form.deadline && <span>{form.deadline} 마감</span>}</div></header>
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
  const [form, setForm] = useState({ title: '', description: '', category: '교육', targetCount: 50, estimatedMinutes: 5, deadline: '', questions: [blankQuestion()] })
  const [aiPrompt, setAiPrompt] = useState(initialPrompt)
  const [aiStep, setAiStep] = useState(0)
  const [aiPurpose, setAiPurpose] = useState(initialPrompt)
  const [aiMessages, setAiMessages] = useState(initialMessages)
  const [aiMessage, setAiMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [history, setHistory] = useState([])
  const [saveStatus, setSaveStatus] = useState('저장됨')
  const [editMode, setEditMode] = useState(false)
  const [editTargetKey, setEditTargetKey] = useState('title')
  const surveyPanelContentRef = useRef(null)
  const selectedIndex = form.questions.findIndex((item) => item.id === selectedQuestionId)
  const draft = useSurveyDraft({
    enabled: isApiConfigured,
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
    if (isApiConfigured) return undefined
    setSaveStatus('저장 중…')
    const timer = window.setTimeout(() => {
      try { localStorage.setItem('uni-form-formmate-draft', JSON.stringify(form)) } catch { /* storage is optional */ }
      setSaveStatus('자동 저장됨')
    }, 700)
    return () => window.clearTimeout(timer)
  }, [form])

  useEffect(() => {
    if (!editMode) return
    window.requestAnimationFrame(() => {
      const container = surveyPanelContentRef.current
      const target = container?.querySelector(`[data-editor-key="${editTargetKey}"]`)
      if (container && target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [editMode, editTargetKey])

  function openEditorAtCurrentPosition() {
    const container = surveyPanelContentRef.current
    const previewItems = [...(container?.querySelectorAll('[data-preview-key]') || [])]
    const containerTop = container?.getBoundingClientRect().top || 0
    const closest = previewItems.reduce((selected, item) => Math.abs(item.getBoundingClientRect().top - containerTop - 12) < Math.abs(selected.getBoundingClientRect().top - containerTop - 12) ? item : selected, previewItems[0])
    setEditTargetKey(closest?.dataset.previewKey || 'title')
    setEditMode(true)
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

  async function sendToFormMate(value) {
    const selected = form.questions[selectedIndex]
    const text = selected ? `[Q${selectedIndex + 1} "${selected.title || '제목 없는 문항'}"에 대해] ${value}` : value
    setAiMessages((current) => [...current, { role: 'user', text: value }])
    setAiPrompt('')
    setAiMessage('')
    setApplying(true)
    try {
      const { aiReply, proposedChanges } = await draft.sendMessage(text)
      setAiMessages((current) => [...current, { role: 'assistant', text: aiReply, changes: proposedChanges.map((change) => ({ ...change, status: 'pending' })) }])
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
    if (isApiConfigured) return sendToFormMate(value)
    setAiMessages((current) => [...current, { role: 'user', text: value }])
    setAiPrompt('')
    setAiMessage('')
    setApplying(true)
    window.setTimeout(() => {
      let reply = ''
      if (aiStep === 0) {
        const subject = value.replace(/[.?!]$/u, '')
        setAiPurpose(subject)
        commitForm((current) => ({ ...current, title: current.title || `${subject} 조사`, description: current.description || `${subject}에 대한 경험과 의견을 알아보기 위한 설문입니다.` }))
        reply = '목적을 반영했어요. 응답에는 몇 분 정도 걸리면 좋을까요?'
      } else if (aiStep === 1) {
        const minutes = Math.min(20, Math.max(1, Number(value.match(/\d+/)?.[0] || 5)))
        const subject = aiPurpose || '이번 주제'
        commitForm((current) => ({ ...current, estimatedMinutes: minutes, questions: [
          { id: crypto.randomUUID(), type: 'single', title: `${subject}와 관련해 가장 가까운 경험은 무엇인가요?`, required: true, options: ['자주 경험함', '가끔 경험함', '거의 경험하지 않음'] },
          { id: crypto.randomUUID(), type: 'scale', title: `${subject}에 대한 현재 만족도를 알려주세요.`, required: true, options: [], min: 1, max: 5 },
          { id: crypto.randomUUID(), type: 'text', title: `${subject}에서 가장 개선되었으면 하는 점은 무엇인가요?`, required: true, options: [] },
        ] }))
        reply = `예상 소요 시간을 약 ${minutes}분으로 설정하고 문항 3개를 추가했어요. 더 얻고 싶은 정보가 있다면 말씀해주세요.`
      } else {
        commitForm((current) => ({ ...current, questions: [...current.questions, { id: crypto.randomUUID(), type: 'text', title: value.endsWith('?') ? value : `${value}에 대해 자유롭게 알려주세요.`, required: true, options: [] }] }))
        reply = '요청하신 내용을 새 문항으로 반영했어요. 오른쪽에서 표현과 순서를 자유롭게 다듬을 수 있습니다.'
      }
      setAiStep((step) => step + 1)
      setAiMessages((current) => [...current, { role: 'assistant', text: reply }])
      setAiMessage('오른쪽 설문에 반영 완료')
      setApplying(false)
    }, 420)
  }

  async function handleSubmit(event) {
    event?.preventDefault()
    setMessage('')
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount, deadline: form.deadline })
    if (validationMessage) return setMessage(validationMessage)
    if (isApiConfigured) {
      try {
        setSubmitting(true)
        await draft.publish()
        navigate('/surveys')
      } catch (error) {
        setMessage(error.messages?.length > 1 ? error.messages.join(' · ') : error.message)
      } finally {
        setSubmitting(false)
      }
      return
    }
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), estimated_minutes: Number(form.estimatedMinutes), deadline: form.deadline, questions: form.questions.filter((question) => question.title.trim()).map((question) => question.type === 'scale' ? { ...question, min: 1, max: 5 } : question) }
    try { setSubmitting(true); await createSurvey(payload); navigate('/surveys') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  return <ServiceShell activePath="/formmate"><div className="create-saas formmate-page motion-page">
    <header className="formmate-page-title"><h1>설문 만들기</h1><p>FormMate와 대화하면서 질문을 만들고 바로 수정하세요.</p></header>
    <section className="create-saas__workspace formmate-workspace">
      <FormMatePanel value={aiPrompt} onChange={setAiPrompt} onSend={handleAgentSend} onUndo={handleUndo} onApplyChanges={handleApplyChanges} onRevertChanges={handleRevertChanges} busyLabel={isApiConfigured ? 'FormMate가 작업하고 있어요.' : undefined} canUndo={history.length > 0 && !applying} selectedLabel={selectedIndex >= 0 ? `Q${selectedIndex + 1} 선택됨` : ''} messages={aiMessages} message={aiMessage} applying={applying} suggestions={isApiConfigured || aiStep === 0 ? [] : aiStep === 1 ? ['5분 정도', '3분 이내'] : ['개선 의견도 추가해줘.']} draftSummary={aiStep > 0 ? { title: form.title, count: form.questions.length, minutes: form.estimatedMinutes, onOpen: () => setEditMode(false) } : null} />
      <section className={`formmate-survey-panel ${editMode ? 'is-editing' : ''}`}>
        <header><div><h2>{editMode ? '설문 편집' : '미리보기'}</h2>{editMode && <span>편집 중</span>}</div><button type="button" onClick={() => editMode ? setEditMode(false) : openEditorAtCurrentPosition()}>{editMode ? '편집 취소' : '수정하기'}</button></header>
        <div className="formmate-survey-panel__content" ref={surveyPanelContentRef}>{draft.loading ? <div className="page-state">초안을 불러오고 있어요.</div> : editMode ? <FormMateSurveyEditor form={form} onChange={(patch) => commitForm(patch)} onQuestionChange={(id, patch) => { const current = form.questions.find((item) => item.id === id); updateQuestion(id, patch.type && patch.type !== current.type ? { ...blankQuestion(patch.type), id, serverId: current.serverId, title: current.title, required: current.required } : patch) }} onAddQuestion={() => commitForm((current) => ({ ...current, questions: [...current.questions, blankQuestion('single')] }))} onDeleteQuestion={(id) => commitForm((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) }))} selectedQuestionId={selectedQuestionId} onSelectQuestion={setSelectedQuestionId} /> : <FormMatePreview form={form} />}</div>
        {(message || draft.error) && <p className="form-message form-message--error">{message || draft.error}</p>}
        <footer><span>{isApiConfigured ? draft.saveStatus || '작성을 시작하면 자동 저장돼요' : saveStatus}</span><div><button className="ui-button ui-button--secondary" type="button" onClick={() => isApiConfigured && draft.flush().catch(() => {})}>임시 저장</button>{editMode ? <button className="ui-button" type="button" onClick={() => setEditMode(false)}>수정 완료</button> : <button className="ui-button" type="button" onClick={() => setPreviewOpen(true)}>설문 등록하기</button>}</div></footer>
      </section>
    </section>
  </div><Modal open={previewOpen} title="설문을 게시할까요?" onClose={() => setPreviewOpen(false)}><div className="survey-preview-list"><p><b>{form.title || '제목 없는 설문'}</b><br />{form.questions.filter((question) => question.title.trim()).length}개 문항 · 약 {form.estimatedMinutes}분 · 목표 {form.targetCount}명</p>{form.questions.filter((question) => question.title.trim()).map((question, index) => <div key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{question.title}</b></div>)}</div><ul className="publish-notices"><li>게시 후에는 설문 내용과 마감일을 수정할 수 없어요.</li><li>마감 30일 후 설문 원문은 파기돼요.</li><li>금지 내용을 포함한 설문은 운영자가 삭제할 수 있어요.</li></ul><div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setPreviewOpen(false)}>편집 계속하기</button><button className="ui-button" type="button" disabled={submitting} onClick={handleSubmit}>{submitting ? '게시 중…' : '설문 게시하기'}</button></div></Modal></ServiceShell>
}
