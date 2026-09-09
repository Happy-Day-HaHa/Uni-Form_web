import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { validateAuth } from '../utils/validation'
import AuthLayout from '../components/AuthLayout'
import '../styles/auth-dandy.css'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isSupabaseConfigured) return navigate('/surveys')
    const validationMessage = validateAuth(form)
    if (validationMessage) return setMessage(validationMessage)
    try {
      setSubmitting(true)
      await login(form)
      navigate('/surveys')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthLayout mode="login"><div className="auth-saas__title"><span>◎</span><div><h1>로그인</h1><p>UniForm에 다시 오신 것을 환영합니다.</p></div></div>{!isSupabaseConfigured && <div className="demo-note">데모 모드입니다. 입력 없이 바로 체험할 수 있어요.</div>}<form className="form-stack" onSubmit={handleSubmit}><label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required={isSupabaseConfigured} /></label><label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="비밀번호를 입력해주세요." required={isSupabaseConfigured} /></label><div className="auth-saas__options"><label><input type="checkbox" /> 로그인 상태 유지</label><button type="button">비밀번호를 잊으셨나요?</button></div>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '로그인 중...' : isSupabaseConfigured ? '로그인' : '데모로 둘러보기'}</button></form><div className="auth-saas__divider"><span>또는</span></div><Link className="auth-saas__alternate" to="/signup">회원가입</Link><p className="auth-card__footer">아직 계정이 없나요? <Link to="/signup">회원가입</Link></p></AuthLayout>
}
