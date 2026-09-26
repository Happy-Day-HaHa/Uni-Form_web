import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { isApiConfigured } from '../services/apiClient'
import { confirmPasswordReset, requestPasswordReset } from '../services/authService'
import { isEmail, validatePassword } from '../utils/validation'
import '../styles/auth-dandy.css'

// 비밀번호 재설정. 메일의 링크(/reset-password?token=...)로 들어오면 새 비밀번호를 받고,
// 토큰 없이 들어오면(로그인 화면의 "비밀번호 찾기") 재설정 메일을 요청한다.
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  return token ? <NewPasswordForm token={token} /> : <RequestResetForm />
}

function RequestResetForm() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isApiConfigured) return setMessage('데모 모드에서는 비밀번호 재설정을 사용할 수 없어요.')
    if (!isEmail(email.trim())) return setMessage('올바른 이메일 주소를 입력해주세요.')
    try {
      setSubmitting(true)
      setMessage('')
      await requestPasswordReset(email.trim())
      setSentTo(email.trim())
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 가입 여부와 관계없이 같은 안내를 보여준다(서버도 계정 존재를 드러내지 않는다).
  if (sentTo) return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>메일을 확인해주세요</h1><p><b>{sentTo}</b>이(가) 가입된 이메일이면 비밀번호 재설정 링크를 보냈어요.</p></div></div><div className="demo-note">메일의 링크를 눌러 새 비밀번호를 정해주세요. 메일이 보이지 않으면 스팸함도 확인해주세요.</div><button className="button button--block button--outline" type="button" onClick={() => setSentTo('')}>다른 이메일로 다시 보내기</button><Link className="button button--block" to="/login">로그인으로 이동</Link></AuthLayout>

  return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>비밀번호 찾기</h1><p>가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p></div></div><form className="form-stack" onSubmit={handleSubmit}><label>이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="hello@example.com" required /></label>{message && <p className="form-message form-message--error" role="alert">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '보내는 중...' : '재설정 메일 보내기'}</button></form><p className="auth-card__footer">비밀번호가 기억나셨나요? <Link to="/login">로그인</Link></p></AuthLayout>
}

function NewPasswordForm({ token }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [tokenInvalid, setTokenInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const passwordMessage = validatePassword(password)
    if (passwordMessage) return setMessage(passwordMessage)
    if (password !== confirm) return setMessage('새 비밀번호가 서로 일치하지 않아요.')
    try {
      setSubmitting(true)
      setMessage('')
      await confirmPasswordReset(token, password)
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (error) {
      // 만료·이미 사용·잘못된 토큰은 모두 같은 400으로 온다. 새 링크를 받게 안내한다.
      if (error.status === 400 && error.message.includes('토큰')) setTokenInvalid(true)
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (tokenInvalid) return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>링크를 다시 받아주세요</h1><p>재설정 링크가 올바르지 않거나, 만료됐거나, 이미 사용됐어요.</p></div></div><p className="form-message form-message--error" role="alert">{message}</p><Link className="button button--block" to="/reset-password">재설정 메일 다시 받기</Link></AuthLayout>

  return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>새 비밀번호 설정</h1><p>로그인에 사용할 새 비밀번호를 입력해주세요.</p></div></div><form className="form-stack" onSubmit={handleSubmit}><label>새 비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="영문, 숫자를 포함해 8자 이상" autoComplete="new-password" required /></label><label>새 비밀번호 확인<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="한 번 더 입력해주세요." autoComplete="new-password" required /></label>{message && <p className="form-message form-message--error" role="alert">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '변경 중...' : '비밀번호 변경'}</button></form></AuthLayout>
}
