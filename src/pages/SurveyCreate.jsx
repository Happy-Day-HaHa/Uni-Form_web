import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { createSurvey } from '../services/surveyService'
import { calculateSurveyBudget, formatPoints } from '../utils/pointCalculator'
import { validateSurvey } from '../utils/validation'

const blankQuestion = () => ({ id: crypto.randomUUID(), title: '', type: 'text', options: [] })
export default function SurveyCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '교육', targetCount: 50, rewardPoints: 100, ageGroup: '전체', questions: [blankQuestion()] })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const budget = calculateSurveyBudget(form.targetCount, form.rewardPoints)
  function updateQuestion(id, value) { setForm((current) => ({ ...current, questions: current.questions.map((question) => question.id === id ? { ...question, title: value } : question) })) }
  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateSurvey({ title: form.title, questions: form.questions, targetCount: form.targetCount, rewardPoints: form.rewardPoints })
    if (validationMessage) return setMessage(validationMessage)
    const payload = { title: form.title, description: form.description, category: form.category, target_count: Number(form.targetCount), reward_points: Number(form.rewardPoints), estimated_minutes: Math.max(1, Math.ceil(form.questions.length * 0.7)), questions: form.questions.filter((question) => question.title.trim()), audience: form.ageGroup === '전체' ? {} : { age_groups: [form.ageGroup] } }
    try { setSubmitting(true); await createSurvey(payload); navigate('/dashboard') } catch (error) { setMessage(error.message) } finally { setSubmitting(false) }
  }
  return <><Header /><main className="app-main app-main--narrow"><div className="page-heading"><p className="eyebrow">CREATE SURVEY</p><h1>필요한 답을 더 빠르게.</h1><p>질문과 모집 조건을 정하면 예상 포인트가 자동 계산됩니다.</p></div><form className="panel form-stack" onSubmit={handleSubmit}><label>설문 제목<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="무엇을 알아보고 싶나요?" /></label><label>설명<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="응답자가 설문 목적을 이해할 수 있도록 적어주세요." /></label><div className="form-grid"><label>카테고리<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['교육', '라이프스타일', '소비', '테크', '문화'].map((item) => <option key={item}>{item}</option>)}</select></label><label>대상 연령<select value={form.ageGroup} onChange={(event) => setForm({ ...form, ageGroup: event.target.value })}>{['전체', '10대', '20대', '30대', '40대', '50대 이상'].map((item) => <option key={item}>{item}</option>)}</select></label><label>목표 응답 수<input type="number" min="1" value={form.targetCount} onChange={(event) => setForm({ ...form, targetCount: event.target.value })} /></label><label>1인당 포인트<input type="number" min="1" value={form.rewardPoints} onChange={(event) => setForm({ ...form, rewardPoints: event.target.value })} /></label></div><div className="question-builder"><div className="section-title"><h2>질문</h2><button type="button" className="text-button" onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}>+ 질문 추가</button></div>{form.questions.map((question, index) => <div className="builder-row" key={question.id}><span>{String(index + 1).padStart(2, '0')}</span><input aria-label={`${index + 1}번 질문`} value={question.title} onChange={(event) => updateQuestion(question.id, event.target.value)} placeholder="질문을 입력하세요." />{form.questions.length > 1 && <button type="button" aria-label="질문 삭제" onClick={() => setForm({ ...form, questions: form.questions.filter((item) => item.id !== question.id) })}>×</button>}</div>)}</div><aside className="budget-summary"><span>필요한 총 포인트</span><strong>{formatPoints(budget)}</strong><small>목표 응답 수 × 1인당 리워드</small></aside>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '설문 생성 중...' : '설문 생성하기'}</button></form></main></>
}
