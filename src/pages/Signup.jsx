import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { validateAuth } from '../utils/validation'
import BrandMark from '../components/BrandMark'
import '../styles/auth-dandy.css'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', occupation: '', age: '', birthDate: '', gender: '', additionalInfo: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    if (!isSupabaseConfigured) return navigate('/surveys')
    const validationMessage = validateAuth(form)
    if (!form.name.trim()) return setMessage('이름을 입력해주세요.')
    if (validationMessage) return setMessage(validationMessage)
    try {
      setSubmitting(true)
      await signup(form)
      navigate('/surveys')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <main className="auth-page auth-page--dandy auth-page--signup"><BrandMark className="auth-page__brand" /><section className="auth-scene" aria-label="추후 이미지를 배치할 영역" /><section className="auth-card"><p className="eyebrow">JOIN UNI-FORM</p><h1>기본 정보를<br />알려주세요.</h1><p>일반 이메일로 가입하고, 나에게 맞는 설문을 만나보세요.</p>{!isSupabaseConfigured && <div className="demo-note">데모 모드에서는 입력 없이도 전체 화면을 체험할 수 있습니다.</div>}<form className="form-stack" onSubmit={handleSubmit}><div className="auth-form-grid"><label>이름<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="홍길동" required={isSupabaseConfigured} /></label><label>직업<input value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} placeholder="대학생, 직장인 등" /></label></div><label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required={isSupabaseConfigured} /></label><label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8자 이상" required={isSupabaseConfigured} /></label><div className="auth-form-grid"><label>나이<input type="number" min="1" max="120" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} placeholder="24" /></label><label>생년월일<input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label></div><label>성별<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">선택하지 않음</option><option>여성</option><option>남성</option><option>기타</option><option>응답하지 않음</option></select></label><label>기타 기본정보<textarea rows="2" value={form.additionalInfo} onChange={(event) => setForm({ ...form, additionalInfo: event.target.value })} placeholder="설문 추천에 참고할 정보를 자유롭게 적어주세요." /></label>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '가입 중...' : isSupabaseConfigured ? '회원가입' : '데모 시작하기'}<span aria-hidden="true">→</span></button></form><p className="auth-card__footer">이미 계정이 있나요? <Link to="/login">로그인</Link></p></section></main>
}
