import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { validateAuth } from '../utils/validation'
import AuthLayout from '../components/AuthLayout'
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
  return <AuthLayout mode="signup"><div className="auth-saas__title"><span>◎</span><div><h1>회원가입</h1><p>의견을 모으는 더 간단한 방법을 시작하세요.</p></div></div>{!isSupabaseConfigured && <div className="demo-note">데모 모드에서는 입력 없이도 전체 화면을 체험할 수 있습니다.</div>}<form className="form-stack" onSubmit={handleSubmit}><label>이름<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="이름을 입력해주세요." required={isSupabaseConfigured} /></label><label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required={isSupabaseConfigured} /><small>대학 이메일이 아니어도 가입할 수 있습니다.</small></label><label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="영문, 숫자를 포함해 8자 이상" required={isSupabaseConfigured} /></label><div className="auth-form-grid"><label>직업<input value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} placeholder="대학생, 직장인 등" /></label><label>나이<input type="number" min="1" max="120" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} placeholder="24" /></label></div><div className="auth-form-grid"><label>생년월일<input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label><label>성별<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">선택하지 않음</option><option>여성</option><option>남성</option><option>기타</option><option>응답하지 않음</option></select></label></div>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '가입 중...' : isSupabaseConfigured ? '회원가입' : '데모 시작하기'}</button></form><div className="auth-saas__divider"><span>또는</span></div><p className="auth-card__footer">이미 계정이 있나요? <Link to="/login">로그인</Link></p></AuthLayout>
}
