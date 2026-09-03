import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { validateAuth } from '../utils/validation'
import BrandMark from '../components/BrandMark'
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

  return <main className="auth-page auth-page--dandy"><BrandMark className="auth-page__brand" /><section className="auth-scene" aria-label="추후 이미지를 배치할 영역" /><section className="auth-card"><p className="eyebrow">WELCOME BACK</p><h1>다시 만나서<br />반가워요.</h1><p>맞춤 설문과 참여 내역을 이어서 확인하세요.</p>{!isSupabaseConfigured && <div className="demo-note">데모 모드입니다. 입력 없이 바로 체험할 수 있어요.</div>}<form className="form-stack" onSubmit={handleSubmit}><label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required={isSupabaseConfigured} /></label><label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8자 이상" required={isSupabaseConfigured} /></label>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '로그인 중...' : isSupabaseConfigured ? '로그인' : '데모로 둘러보기'}<span aria-hidden="true">→</span></button></form><p className="auth-card__footer">처음이신가요? <Link to="/signup">회원가입</Link></p></section></main>
}
