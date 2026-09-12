import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FormMatePanel from '../components/formmate/FormMatePanel'
import Modal from '../components/Modal'
import ServiceShell from '../components/ServiceShell'
import SurveyEditorPanel from '../components/survey/SurveyEditorPanel'
import { createSurvey } from '../services/surveyService'
import { validateSurvey } from '../utils/validation'

const blankQuestion = (type = 'text') => ({ id: crypto.randomUUID(), title: '', type, options: type === 'single' ? ['선택 1', '선택 2'] : [], ...(type === 'scale' ? { min: 1, max: 5 } : {}) })
const initialMessages = [{ role: 'assistant', text: '안녕하세요! 어떤 설문을 만들고 싶으신가요? 먼저 이번 설문의 목적을 알려주세요.' }]

export default function SurveyCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialPrompt = location.state?.formMatePrompt || ''
  const [form, setForm] = useState({ title: '', description: '', category: '교육', targetCount: 50, estimatedMinutes: 5, ageGroup: '전체', visibility: '전체 공개', questions: [blankQuestion()] })
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
        reply = '요청하신 내용을 새 문항으로 반영했어요. 왼쪽에서 표현과 순서를 자유롭게 다듬을 수 있습니다.'
      }
      setAiStep((step) => step + 1)
      setAiMessages((current) => [...current, { role: 'assistant', text: reply }])
      setAiMessage('왼쪽 설문에 반영 완료')
      setApplying(false)
    }, 420)
  }

  async function handleSubmit(event) {
    event?.preventDefault()
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount })
    if (validationMessage) return setMessage(validationMessage)
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), estimated_minutes: Number(form.estimatedMinutes), questions: form.questions.filter((question) => question.title.trim()), audience: form.ageGroup === '전체' ? {} : { age_groups: [form.ageGroup] }, visibility: form.visibility }
    try { setSubmitting(true); await createSurvey(payload); navigate('/surveys') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  return <ServiceShell activePath="/formmate"><div className="create-saas formmate-page motion-page">
    <div className="create-saas__back">← 내 설문으로 돌아가기 <span>{saveStatus}</span></div>
    <header className="create-saas__header"><div><span className="create-saas__icon">✦</span><div><h1>FormMate <em>AI와 함께 작성 중</em></h1><p>대화와 미리보기가 실시간으로 연결됩니다.</p></div></div><ol>{['아이디어', '문항 구성', '설정', '적용'].map((item, index) => <li className={index === 0 ? 'is-active' : ''} key={item}><span>{index + 1}</span>{item}</li>)}</ol></header>
    <section className="create-saas__workspace">
      <FormMatePanel value={aiPrompt} onChange={setAiPrompt} onSend={handleAgentSend} onUndo={() => { const previous = history.at(-1); if (previous) { setForm(previous); setHistory((past) => past.slice(0, -1)); setAiMessage('마지막 변경을 되돌렸어요.') } }} canUndo={history.length > 0} selectedLabel={selectedQuestionId ? `Q${form.questions.findIndex((item) => item.id === selectedQuestionId) + 1} 선택됨` : ''} messages={aiMessages} message={aiMessage} applying={applying} suggestions={aiStep === 0 ? ['AI 서비스 사용 경험을 알아보고 싶어요.', '캠퍼스 시설 만족도를 조사하고 싶어요.'] : aiStep === 1 ? ['대학생 전체', '20대 이용자'] : aiStep === 2 ? ['5분 정도', '3분 이내'] : ['개선 의견도 추가해줘.']} />
      <form className="create-saas__editor-form" onSubmit={handleSubmit}>
        <SurveyEditorPanel form={form} onChange={(patch) => commitForm(patch)} onQuestionChange={(id, patch) => { const current = form.questions.find((item) => item.id === id); updateQuestion(id, patch.type && patch.type !== current.type ? { ...blankQuestion(patch.type), id, title: current.title } : patch) }} onAddQuestion={() => commitForm((current) => ({ ...current, questions: [...current.questions, blankQuestion('single')] }))} onDeleteQuestion={(id) => commitForm((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) }))} selectedQuestionId={selectedQuestionId} onSelectQuestion={setSelectedQuestionId} aiApplied={aiStep > 0} />
        {message && <p className="form-message form-message--error">{message}</p>}<div className="create-saas__actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setPreviewOpen(true)}>최종 확인</button><button className="ui-button" type="button" onClick={() => setPreviewOpen(true)}>UniForm에 적용하기 <span>→</span></button></div>
      </form>
    </section>
  </div><Modal open={previewOpen} title="설문을 UniForm에 적용할까요?" onClose={() => setPreviewOpen(false)}><div className="survey-preview-list"><p><b>{form.title || '제목 없는 설문'}</b><br />{form.questions.filter((question) => question.title.trim()).length}개 문항 · 약 {form.estimatedMinutes}분 · 목표 {form.targetCount}명</p>{form.questions.filter((question) => question.title.trim()).map((question, index) => <div key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{question.title}</b></div>)}</div><div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setPreviewOpen(false)}>편집 계속하기</button><button className="ui-button" type="button" disabled={submitting} onClick={handleSubmit}>{submitting ? '적용 중…' : '설문 적용하기'}</button></div></Modal></ServiceShell>
}
