import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { validateAuth } from '../utils/validation'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    if (!isSupabaseConfigured) return navigate('/profile')
    const validationMessage = validateAuth(form)
    if (!form.name.trim()) return setMessage('이름을 입력해주세요.')
    if (validationMessage) return setMessage(validationMessage)
    try {
      setSubmitting(true)
      await signup(form)
      navigate('/profile')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <main className="auth-page"><Link className="brand auth-page__brand" to="/">UNI<span>FORM</span></Link><section className="auth-card"><p className="eyebrow">JOIN UNI-FORM</p><h1>의견의 가치를 시작하세요.</h1><p>간단한 가입 뒤 설문에 참여하고 직접 만들 수 있어요.</p>{!isSupabaseConfigured && <div className="demo-note">Supabase 연결 전에도 전체 화면을 체험할 수 있습니다.</div>}<form className="form-stack" onSubmit={handleSubmit}><label>이름<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="홍길동" required={isSupabaseConfigured} /></label><label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required={isSupabaseConfigured} /></label><label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8자 이상" required={isSupabaseConfigured} /></label>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '가입 중...' : isSupabaseConfigured ? '회원가입' : '데모 시작하기'}</button></form><p className="auth-card__footer">이미 계정이 있나요? <Link to="/login">로그인</Link></p></section></main>
}
