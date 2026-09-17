import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabase'
import { validateSignup } from '../utils/validation'
import AuthLayout from '../components/AuthLayout'
import '../styles/auth-dandy.css'

const genderOptions = ['남성', '여성', '응답하지 않음']
const gradeOptions = ['1학년', '2학년', '3학년', '4학년 이상', '대학원', '해당 없음']
const majorOptions = ['인문사회', '상경', '공학', '자연과학', '의약', '예체능', '교육', '해당 없음']
const enrollmentOptions = ['재학', '휴학', '졸업', '해당 없음']

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nickname: '', email: '', password: '', gender: '응답하지 않음', grade: '해당 없음', major: '해당 없음', enrollmentStatus: '해당 없음' })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isSupabaseConfigured) return navigate('/surveys')
    const validationMessage = validateSignup(form)
    if (validationMessage) return setMessage(validationMessage)
    if (!agreeTerms) return setMessage('이용약관 및 개인정보 처리방침에 동의해주세요.')
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

  return <AuthLayout mode="signup">
    <div className="auth-saas__title"><span>◎</span><div><h1>회원가입</h1><p>대학(원)생을 위한 설문 플랫폼, UniForm을 시작하세요.</p></div></div>
    {!isSupabaseConfigured && <div className="demo-note">데모 모드에서는 입력 없이도 전체 화면을 체험할 수 있습니다.</div>}
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>닉네임<input value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="2~12자, 한글/영문/숫자" maxLength={12} required={isSupabaseConfigured} /></label>
      <label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required={isSupabaseConfigured} /></label>
      <label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="영문, 숫자를 포함해 8자 이상" required={isSupabaseConfigured} /></label>
      <div className="auth-form-grid">
        <label>성별<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>{genderOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>학년<select value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })}>{gradeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="auth-form-grid">
        <label>전공 계열<select value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })}>{majorOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>재학 상태<select value={form.enrollmentStatus} onChange={(event) => setForm({ ...form, enrollmentStatus: event.target.value })}>{enrollmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label className="auth-saas__agree"><input type="checkbox" checked={agreeTerms} onChange={(event) => setAgreeTerms(event.target.checked)} /> <span>[필수] <Link to="/support">이용약관</Link> 및 개인정보 처리방침에 동의합니다.</span></label>
      {message && <p className="form-message form-message--error">{message}</p>}
      <button className="button button--block" disabled={submitting}>{submitting ? '가입 중...' : isSupabaseConfigured ? '회원가입' : '데모 시작하기'}</button>
    </form>
    <div className="auth-saas__divider"><span>또는</span></div>
    <p className="auth-card__footer">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
  </AuthLayout>
}
