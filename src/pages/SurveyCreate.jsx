import { useState } from 'react'
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

  function updateQuestion(id, patch) {
    setForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }))
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
        setForm((current) => ({ ...current, title: current.title || `${subject} 조사`, description: current.description || `${subject}에 대한 경험과 의견을 알아보기 위한 설문입니다.` }))
        reply = '목적을 반영했어요. 이 설문에 참여할 대상은 누구인가요?'
      } else if (aiStep === 1) {
        const group = ['10대', '20대', '30대', '40대', '50대 이상'].find((item) => value.includes(item)) || '전체'
        setForm((current) => ({ ...current, ageGroup: group }))
        reply = '대상 조건을 반영했어요. 응답에는 몇 분 정도 걸리면 좋을까요?'
      } else if (aiStep === 2) {
        const minutes = Math.min(20, Math.max(1, Number(value.match(/\d+/)?.[0] || 5)))
        const subject = aiPurpose || '이번 주제'
        setForm((current) => ({ ...current, estimatedMinutes: minutes, questions: [
          { id: crypto.randomUUID(), type: 'single', title: `${subject}와 관련해 가장 가까운 경험은 무엇인가요?`, options: ['자주 경험함', '가끔 경험함', '거의 경험하지 않음'] },
          { id: crypto.randomUUID(), type: 'scale', title: `${subject}에 대한 현재 만족도를 알려주세요.`, options: [], min: 1, max: 5 },
          { id: crypto.randomUUID(), type: 'text', title: `${subject}에서 가장 개선되었으면 하는 점은 무엇인가요?`, options: [] },
        ] }))
        reply = `예상 소요 시간을 약 ${minutes}분으로 설정하고 문항 3개를 추가했어요. 더 얻고 싶은 정보가 있다면 말씀해주세요.`
      } else {
        setForm((current) => ({ ...current, questions: [...current.questions, { id: crypto.randomUUID(), type: 'text', title: value.endsWith('?') ? value : `${value}에 대해 자유롭게 알려주세요.`, options: [] }] }))
        reply = '요청하신 내용을 새 문항으로 반영했어요. 왼쪽에서 표현과 순서를 자유롭게 다듬을 수 있습니다.'
      }
      setAiStep((step) => step + 1)
      setAiMessages((current) => [...current, { role: 'assistant', text: reply }])
      setAiMessage('왼쪽 설문에 반영 완료')
      setApplying(false)
    }, 420)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount })
    if (validationMessage) return setMessage(validationMessage)
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), estimated_minutes: Number(form.estimatedMinutes), questions: form.questions.filter((question) => question.title.trim()), audience: form.ageGroup === '전체' ? {} : { age_groups: [form.ageGroup] }, visibility: form.visibility }
    try { setSubmitting(true); await createSurvey(payload); navigate('/surveys') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  return <ServiceShell activePath="/my-surveys"><div className="create-saas motion-page">
    <div className="create-saas__back">← 내 설문으로 돌아가기</div>
    <header className="create-saas__header"><div><span className="create-saas__icon">↗</span><div><h1>새 설문 만들기 <em>AI와 함께 작성 중</em></h1><p>왼쪽에서 직접 편집하고, 오른쪽 AI 도우미와 대화하며 설문을 완성하세요.</p></div></div><ol>{['기본 정보', '문항 구성', '배포 설정', '미리보기'].map((item, index) => <li className={index === 0 ? 'is-active' : ''} key={item}><span>{index + 1}</span>{item}</li>)}</ol></header>
    <section className="create-saas__workspace">
      <form className="create-saas__editor-form" onSubmit={handleSubmit}>
        <SurveyEditorPanel form={form} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} onQuestionChange={(id, patch) => { const current = form.questions.find((item) => item.id === id); updateQuestion(id, patch.type && patch.type !== current.type ? { ...blankQuestion(patch.type), id, title: current.title } : patch) }} onAddQuestion={() => setForm({ ...form, questions: [...form.questions, blankQuestion('single')] })} onDeleteQuestion={(id) => setForm({ ...form, questions: form.questions.filter((item) => item.id !== id) })} aiApplied={aiStep > 0} />
        {message && <p className="form-message form-message--error">{message}</p>}<div className="create-saas__actions"><button className="ui-button ui-button--secondary" type="button" onClick={() => setPreviewOpen(true)}>미리보기</button><button className="ui-button" disabled={submitting}>{submitting ? '설문 생성 중...' : '설문 등록하기'} <span>→</span></button></div>
      </form>
      <FormMatePanel value={aiPrompt} onChange={setAiPrompt} onSend={handleAgentSend} messages={aiMessages} message={aiMessage} applying={applying} suggestions={aiStep === 0 ? ['AI 서비스 사용 경험을 알아보고 싶어요.', '캠퍼스 시설 만족도를 조사하고 싶어요.'] : aiStep === 1 ? ['대학생 전체', '20대 이용자'] : aiStep === 2 ? ['5분 정도', '3분 이내'] : ['개선 의견도 추가해줘.']} />
    </section>
  </div><Modal open={previewOpen} title={form.title || '제목 없는 설문'} onClose={() => setPreviewOpen(false)}><div className="survey-preview-list">{form.description && <p>{form.description}</p>}{form.questions.filter((question) => question.title.trim()).map((question, index) => <div key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{question.title}</b></div>)}</div><button className="button button--block" type="button" onClick={() => setPreviewOpen(false)}>편집 계속하기</button></Modal></ServiceShell>
}
