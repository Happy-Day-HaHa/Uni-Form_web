import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { createSurvey } from '../services/surveyService'
import { calculateSurveyBudget, formatPoints } from '../utils/pointCalculator'
import { validateSurvey } from '../utils/validation'

const blankQuestion = (type = 'text') => ({ id: crypto.randomUUID(), title: '', type, options: type === 'single' ? ['선택 1', '선택 2'] : [], ...(type === 'scale' ? { min: 1, max: 5 } : {}) })

export default function SurveyCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '교육', targetCount: 50, rewardPoints: 100, ageGroup: '전체', questions: [blankQuestion()] })
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const budget = calculateSurveyBudget(form.targetCount, form.rewardPoints)

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
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount, rewardPoints: form.rewardPoints })
    if (validationMessage) return setMessage(validationMessage)
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), reward_points: Number(form.rewardPoints), estimated_minutes: Math.max(1, Math.ceil(form.questions.length * 0.7)), questions: form.questions.filter((question) => question.title.trim()), audience: form.ageGroup === '전체' ? {} : { age_groups: [form.ageGroup] } }
    try { setSubmitting(true); await createSurvey(payload); navigate('/dashboard') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }

  return <><Header /><main className="app-main app-main--narrow create-page"><div className="page-heading"><p className="eyebrow">AI SURVEY BUILDER</p><h1>알아보고 싶은 것을<br />설문으로 바꿔보세요.</h1><p>AI 초안으로 시작한 뒤 질문과 모집 조건을 직접 다듬을 수 있어요.</p></div>
    <section className="ai-draft-panel"><div><span>✦ UNI AI</span><h2>어떤 내용을 알아보고 싶나요?</h2><p>조사 목적을 한두 문장으로 설명하면 질문 구조를 추천해드려요.</p></div><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows="3" placeholder="예: 대학생의 통학 시간과 수업 만족도의 관계를 알아보고 싶어요." /><button type="button" onClick={createAiDraft}>AI 질문 초안 만들기 →</button>{aiMessage && <small>{aiMessage}</small>}</section>
    <form className="panel form-stack survey-create-form" onSubmit={handleSubmit}><label>설문 제목<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="무엇을 알아보고 싶나요?" /></label><label>설명<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="응답자가 설문 목적을 이해할 수 있도록 적어주세요." /></label><div className="form-grid"><label>카테고리<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['교육', '라이프스타일', '소비', '테크', '문화'].map((item) => <option key={item}>{item}</option>)}</select></label><label>대상 연령<select value={form.ageGroup} onChange={(event) => setForm({ ...form, ageGroup: event.target.value })}>{['전체', '10대', '20대', '30대', '40대', '50대 이상'].map((item) => <option key={item}>{item}</option>)}</select></label><label>목표 응답 수<input type="number" min="1" value={form.targetCount} onChange={(event) => setForm({ ...form, targetCount: event.target.value })} /></label><label>1인당 포인트<input type="number" min="1" value={form.rewardPoints} onChange={(event) => setForm({ ...form, rewardPoints: event.target.value })} /></label></div>
      <div className="question-builder"><div className="section-title"><div><p className="eyebrow">QUESTIONS</p><h2>질문 구성</h2></div><button type="button" className="text-button" onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}>+ 질문 추가</button></div>{form.questions.map((question, index) => <div className="builder-row builder-row--expanded" key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><div><select aria-label={`${index + 1}번 질문 유형`} value={question.type} onChange={(event) => updateQuestion(question.id, { ...blankQuestion(event.target.value), id: question.id })}><option value="text">주관식</option><option value="single">객관식</option><option value="scale">척도형</option></select><input aria-label={`${index + 1}번 질문`} value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} placeholder="질문을 입력하세요." />{question.type === 'single' && <input aria-label={`${index + 1}번 선택지`} value={question.options.join(', ')} onChange={(event) => updateQuestion(question.id, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="선택지를 쉼표로 구분하세요." />}</div>{form.questions.length > 1 && <button type="button" aria-label="질문 삭제" onClick={() => setForm({ ...form, questions: form.questions.filter((item) => item.id !== question.id) })}>×</button>}</div>)}</div>
      <aside className="budget-summary"><span>필요한 총 포인트</span><strong>{formatPoints(budget)}</strong><small>목표 응답 수 × 1인당 리워드</small></aside>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '설문 생성 중...' : '설문 개설하기'}</button></form>
  </main></>
}
