import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FormMatePanel from '../components/formmate/FormMatePanel'
import FormMateSurveyEditor from '../components/formmate/FormMateSurveyEditor'
import Modal from '../components/Modal'
import ServiceShell from '../components/ServiceShell'
import { createSurvey } from '../services/surveyService'
import { validateSurvey } from '../utils/validation'

const blankQuestion = (type = 'text') => ({ id: crypto.randomUUID(), title: '', type, required: true, options: (type === 'single' || type === 'multiple') ? ['선택 1', '선택 2'] : [], ...(type === 'scale' ? { min: 1, max: 5 } : {}) })
const initialMessages = [{ role: 'assistant', text: '안녕하세요! 저는 FormMate입니다.\n어떤 설문을 만들어볼까요?' }]
function FormMatePreview({ form }) {
  const examples = [
    { id: 'example-1', title: '현재 학년을 선택해주세요.', type: 'single', options: ['1학년', '2학년', '3학년', '4학년', '대학원생'] },
    { id: 'example-2', title: '평소 하루 평균 학습에 투자하는 시간은 얼마인가요?', type: 'single', options: ['1시간 미만', '1~3시간', '3~5시간', '5시간 이상'] },
  ]
  const questions = form.questions.filter((question) => question.title.trim()).slice(0, 2)
  const visibleQuestions = questions.length ? questions : examples
  return <div className="formmate-preview-body">
    <div className="formmate-preview-title"><h3>{form.title || '대학생의 시간 관리 방법에 대한 설문'}</h3><p>{form.description || '여러분의 소중한 의견이 더 나은 대학 생활을 만듭니다.'}</p></div>
    <div className="formmate-preview-progress"><i><span /></i><b>1 / {Math.max(form.questions.length, 8)}</b></div>
    <div className="formmate-preview-questions">{visibleQuestions.map((question, index) => <fieldset key={question.id}><legend>{index + 1}. {question.title}</legend>{question.type === 'text' || question.type === 'long' ? <textarea readOnly placeholder="답변을 입력해주세요." /> : (question.options?.length ? question.options : ['1', '2', '3', '4', '5']).map((option) => <label key={option}><input type="radio" name={`preview-${question.id}`} /> <span>{option}</span></label>)}</fieldset>)}</div>
    <div className="formmate-preview-nav"><button type="button" disabled>← 이전</button><button type="button">다음 →</button></div>
  </div>
}

export default function SurveyCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialPrompt = location.state?.formMatePrompt || ''
  const [form, setForm] = useState({ title: '', description: '', category: '교육', targetCount: 50, estimatedMinutes: 5, deadline: '', ageGroup: '전체', visibility: '전체 공개', questions: [blankQuestion()] })
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

  useEffect(() => {
    setSaveStatus('저장 중…')
    const timer = window.setTimeout(() => {
      try { localStorage.setItem('uni-form-formmate-draft', JSON.stringify(form)) } catch { /* storage is optional */ }
      setSaveStatus('자동 저장됨')
    }, 700)
    return () => window.clearTimeout(timer)
  }, [form])

  function commitForm(updater) {
    setForm((current) => {
      setHistory((past) => [...past.slice(-9), current])
      return typeof updater === 'function' ? updater(current) : { ...current, ...updater }
    })
  }

  function updateQuestion(id, patch) {
    commitForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }))
  }

  function handleAgentSend(rawValue) {
    const value = rawValue.trim()
    if (value.length < 2 || applying) return setAiMessage('조금 더 구체적으로 입력해주세요.')
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
        reply = '목적을 반영했어요. 이 설문에 참여할 대상은 누구인가요?'
      } else if (aiStep === 1) {
        const group = ['10대', '20대', '30대', '40대', '50대 이상'].find((item) => value.includes(item)) || '전체'
        commitForm((current) => ({ ...current, ageGroup: group }))
        reply = '대상 조건을 반영했어요. 응답에는 몇 분 정도 걸리면 좋을까요?'
      } else if (aiStep === 2) {
        const minutes = Math.min(20, Math.max(1, Number(value.match(/\d+/)?.[0] || 5)))
        const subject = aiPurpose || '이번 주제'
        commitForm((current) => ({ ...current, estimatedMinutes: minutes, questions: [
          { id: crypto.randomUUID(), type: 'single', title: `${subject}와 관련해 가장 가까운 경험은 무엇인가요?`, options: ['자주 경험함', '가끔 경험함', '거의 경험하지 않음'] },
          { id: crypto.randomUUID(), type: 'scale', title: `${subject}에 대한 현재 만족도를 알려주세요.`, options: [], min: 1, max: 5 },
          { id: crypto.randomUUID(), type: 'text', title: `${subject}에서 가장 개선되었으면 하는 점은 무엇인가요?`, options: [] },
        ] }))
        reply = `예상 소요 시간을 약 ${minutes}분으로 설정하고 문항 3개를 추가했어요. 더 얻고 싶은 정보가 있다면 말씀해주세요.`
      } else {
        commitForm((current) => ({ ...current, questions: [...current.questions, { id: crypto.randomUUID(), type: 'text', title: value.endsWith('?') ? value : `${value}에 대해 자유롭게 알려주세요.`, options: [] }] }))
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
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount })
    if (validationMessage) return setMessage(validationMessage)
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), estimated_minutes: Number(form.estimatedMinutes), deadline: form.deadline || null, questions: form.questions.filter((question) => question.title.trim()), audience: form.ageGroup === '전체' ? {} : { age_groups: [form.ageGroup] }, visibility: form.visibility }
    try { setSubmitting(true); await createSurvey(payload); navigate('/surveys') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  return <ServiceShell activePath="/formmate"><div className="create-saas formmate-page motion-page">
    <header className="formmate-page-title"><h1>설문 만들기</h1><p>FormMate와 대화하면서 질문을 만들고 바로 수정하세요.</p></header>
    <section className="create-saas__workspace formmate-workspace">
      <FormMatePanel value={aiPrompt} onChange={setAiPrompt} onSend={handleAgentSend} onUndo={() => { const previous = history.at(-1); if (previous) { setForm(previous); setHistory((past) => past.slice(0, -1)); setAiMessage('마지막 변경을 되돌렸어요.') } }} canUndo={history.length > 0} selectedLabel={selectedQuestionId ? `Q${form.questions.findIndex((item) => item.id === selectedQuestionId) + 1} 선택됨` : ''} messages={aiMessages} message={aiMessage} applying={applying} suggestions={aiStep === 0 ? [] : aiStep === 1 ? ['대학생 전체', '20대 이용자'] : aiStep === 2 ? ['5분 정도', '3분 이내'] : ['개선 의견도 추가해줘.']} draftSummary={aiStep > 0 ? { title: form.title, count: form.questions.length, minutes: form.estimatedMinutes, onOpen: () => setEditMode(false) } : null} />
      <section className={`formmate-survey-panel ${editMode ? 'is-editing' : ''}`}>
        <header><div><h2>{editMode ? '설문 편집' : '미리보기'}</h2>{editMode && <span>편집 중</span>}</div><button type="button" onClick={() => setEditMode((value) => !value)}>{editMode ? '편집 취소' : '수정하기'}</button></header>
        <div className="formmate-survey-panel__content">{editMode ? <FormMateSurveyEditor form={form} onChange={(patch) => commitForm(patch)} onQuestionChange={(id, patch) => { const current = form.questions.find((item) => item.id === id); updateQuestion(id, patch.type && patch.type !== current.type ? { ...blankQuestion(patch.type), id, title: current.title, required: current.required } : patch) }} onAddQuestion={() => commitForm((current) => ({ ...current, questions: [...current.questions, blankQuestion('single')] }))} onDeleteQuestion={(id) => commitForm((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) }))} selectedQuestionId={selectedQuestionId} onSelectQuestion={setSelectedQuestionId} /> : <FormMatePreview form={form} />}</div>
        {message && <p className="form-message form-message--error">{message}</p>}
        <footer><span>{saveStatus}</span><div><button className="ui-button ui-button--secondary" type="button">임시 저장</button>{editMode ? <button className="ui-button" type="button" onClick={() => setEditMode(false)}>수정 완료</button> : <button className="ui-button" type="button" onClick={() => setPreviewOpen(true)}>설문 등록하기</button>}</div></footer>
      </section>
    </section>
  </div><Modal open={previewOpen} title="설문을 UniForm에 적용할까요?" onClose={() => setPreviewOpen(false)}><div className="survey-preview-list"><p><b>{form.title || '제목 없는 설문'}</b><br />{form.questions.filter((question) => question.title.trim()).length}개 문항 · 약 {form.estimatedMinutes}분 · 목표 {form.targetCount}명</p>{form.questions.filter((question) => question.title.trim()).map((question, index) => <div key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{question.title}</b></div>)}</div><div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setPreviewOpen(false)}>편집 계속하기</button><button className="ui-button" type="button" disabled={submitting} onClick={handleSubmit}>{submitting ? '적용 중…' : '설문 적용하기'}</button></div></Modal></ServiceShell>
}
