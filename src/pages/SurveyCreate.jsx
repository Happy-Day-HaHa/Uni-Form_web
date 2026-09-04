import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Modal from '../components/Modal'
import { createSurvey } from '../services/surveyService'
import { validateSurvey } from '../utils/validation'

const blankQuestion = (type = 'text') => ({ id: crypto.randomUUID(), title: '', type, options: type === 'single' ? ['선택 1', '선택 2'] : [], ...(type === 'scale' ? { min: 1, max: 5 } : {}) })

export default function SurveyCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '교육', targetCount: 50, ageGroup: '전체', questions: [blankQuestion()] })
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  function updateQuestion(id, patch) {
    setForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question) }))
  }

  function createAiDraft() {
    const purpose = aiPrompt.trim()
    if (purpose.length < 5) return setAiMessage('알아보고 싶은 내용을 조금 더 구체적으로 적어주세요.')
    const subject = purpose.replace(/[.?!]$/u, '')
    setForm((current) => ({
      ...current,
      title: current.title || `${subject} 설문`,
      description: current.description || `${subject}에 대한 경험과 의견을 알아보기 위한 설문입니다.`,
      questions: [
        { id: crypto.randomUUID(), type: 'single', title: `${subject}와 관련해 가장 가까운 경험은 무엇인가요?`, options: ['매우 많음', '가끔 있음', '거의 없음'] },
        { id: crypto.randomUUID(), type: 'scale', title: `${subject}에 대한 현재 만족도를 알려주세요.`, options: [], min: 1, max: 5 },
        { id: crypto.randomUUID(), type: 'text', title: `${subject}에서 가장 개선되었으면 하는 점은 무엇인가요?`, options: [] },
      ],
    }))
    setAiMessage('질문 초안을 만들었어요. 아래에서 자유롭게 수정할 수 있습니다.')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount })
    if (validationMessage) return setMessage(validationMessage)
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), estimated_minutes: Math.max(1, Math.ceil(form.questions.length * 0.7)), questions: form.questions.filter((question) => question.title.trim()), audience: form.ageGroup === '전체' ? {} : { age_groups: [form.ageGroup] } }
    try { setSubmitting(true); await createSurvey(payload); navigate('/surveys') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  return <><Header /><main className="app-main create-page"><div className="page-heading"><p className="eyebrow">SURVEY WORKSPACE</p><h1>떠오른 생각을,<br />바로 설문으로.</h1><p>직접 문항을 입력하거나 Uni-Chat과 대화하며 초안을 빠르게 완성하세요.</p></div>
    <section className="create-workspace">
      <form className="panel form-stack survey-create-form" onSubmit={handleSubmit}><div className="workspace-label"><span>01</span><b>설문 편집</b></div><label>설문 제목<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="무엇을 알아보고 싶나요?" /></label><label>설명<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="응답자가 설문 목적을 이해할 수 있도록 적어주세요." /></label><div className="form-grid"><label>카테고리<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['교육', '라이프스타일', '소비', '테크', '문화'].map((item) => <option key={item}>{item}</option>)}</select></label><label>대상 연령<select value={form.ageGroup} onChange={(event) => setForm({ ...form, ageGroup: event.target.value })}>{['전체', '10대', '20대', '30대', '40대', '50대 이상'].map((item) => <option key={item}>{item}</option>)}</select></label><label>목표 응답 수<input type="number" min="1" value={form.targetCount} onChange={(event) => setForm({ ...form, targetCount: event.target.value })} /></label></div>
        <div className="question-builder"><div className="section-title"><div><p className="eyebrow">QUESTIONS</p><h2>질문 구성</h2></div><button type="button" className="text-button" onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}>+ 질문 추가</button></div>{form.questions.map((question, index) => <div className="builder-row builder-row--expanded" key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><div><select aria-label={`${index + 1}번 질문 유형`} value={question.type} onChange={(event) => updateQuestion(question.id, { ...blankQuestion(event.target.value), id: question.id })}><option value="text">주관식</option><option value="single">객관식</option><option value="scale">척도형</option></select><input aria-label={`${index + 1}번 질문`} value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} placeholder="질문을 입력하세요." />{question.type === 'single' && <input aria-label={`${index + 1}번 선택지`} value={question.options.join(', ')} onChange={(event) => updateQuestion(question.id, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="선택지를 쉼표로 구분하세요." />}</div>{form.questions.length > 1 && <button type="button" aria-label="질문 삭제" onClick={() => setForm({ ...form, questions: form.questions.filter((item) => item.id !== question.id) })}>×</button>}</div>)}</div>
        {message && <p className="form-message form-message--error">{message}</p>}<div className="create-submit-row"><button className="button button--ghost" type="button" onClick={() => setPreviewOpen(true)}>미리보기</button><button className="button" disabled={submitting}>{submitting ? '설문 생성 중...' : '설문 등록하기'}</button></div></form>
      <aside className="ai-draft-panel"><div className="workspace-label"><span>02</span><b>UNI-CHAT</b></div><div><span>✦ AI SURVEY PARTNER</span><h2>어떤 설문이 필요한가요?</h2><p>목적과 응답 대상을 편하게 적으면 질문과 보기를 한 번에 구성해드려요.</p></div><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows="5" placeholder="예: 대학생의 통학 경험과 만족도를 알아보고 싶어요." /><button type="button" onClick={createAiDraft}>질문 초안 만들기 →</button>{aiMessage && <small>{aiMessage}</small>}</aside>
    </section>
  </main><Modal open={previewOpen} title={form.title || '제목 없는 설문'} onClose={() => setPreviewOpen(false)}><div className="survey-preview-list">{form.description && <p>{form.description}</p>}{form.questions.filter((question) => question.title.trim()).map((question, index) => <div key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{question.title}</b></div>)}{!form.questions.some((question) => question.title.trim()) && <p>질문을 입력하면 이곳에서 미리 볼 수 있어요.</p>}</div><button className="button button--block" type="button" onClick={() => setPreviewOpen(false)}>편집 계속하기</button></Modal></>
}
