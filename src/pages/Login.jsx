import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { clearPageNotice, login, peekPageNotice } from '../services/authService'
import { validateAuth } from '../utils/validation'
import { redirectFromState, safeRedirectPath } from '../utils/safeRedirect'
import AuthLayout from '../components/AuthLayout'
import Checkbox from '../components/Checkbox'
import '../styles/auth-dandy.css'

export default function Login() {
  const navigate = useNavigate()
  // 로그인이 필요한 화면(예: 팀 초대 링크)에서 넘어왔으면 로그인 후 그 화면으로 돌아간다.
  const location = useLocation()
  // 로그아웃시키며 남긴 안내(약관 거절·세션 만료 등)는 한 번만 보여준다.
  const [notice] = useState(() => location.state?.notice || peekPageNotice('login'))
  useEffect(() => { clearPageNotice('login') }, [])
  const { user, loading: authLoading } = useAuth()
  // 로그인이 필요한 화면에서 보내졌으면(PrivateRoute가 라우터 state.from을 넘김) 로그인 후 그 화면으로 돌아간다.
  // 같은 사이트 내부 경로만 따르고, 이상한 값이면 대시보드로 보낸다. from이 없으면(직접 로그인) 설문 목록으로.
  const requestedPath = redirectFromState(location.state?.from)
  const redirectTo = requestedPath === null ? '/surveys' : safeRedirectPath(requestedPath)
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [remember, setRemember] = useState(() => {
    try {
      return localStorage.getItem('uniform-remember-login') === '1'
    } catch {
      return false
    }
  })

  function changeRemember(checked) {
    setRemember(checked)
    try {
      localStorage.setItem('uniform-remember-login', checked ? '1' : '0')
    } catch {
      // The checked state still works when storage is blocked by the browser.
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateAuth(form)
    if (validationMessage) return setMessage(validationMessage)
    try {
      setSubmitting(true)
      await login(form)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 이미 로그인한 사용자는 로그인 화면 대신 원래 가려던 화면으로 보낸다.
  if (!authLoading && user) return <Navigate to={redirectTo} replace />

  return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>로그인</h1><p>UniForm에 다시 오신 것을 환영합니다.</p></div></div>{location.state?.passwordReset && <div className="info-note" role="status">비밀번호를 변경했어요. 새 비밀번호로 로그인해주세요.</div>}{notice ? <div className="info-note" role="status">{notice}</div> : location.state?.from && !location.state?.passwordReset && <div className="info-note" role="status">로그인 후 이용할 수 있어요. 로그인하면 보려던 화면으로 돌아갈게요.</div>}<form className="form-stack" onSubmit={handleSubmit}><label>이메일<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="hello@example.com" required /></label><label>비밀번호<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="비밀번호를 입력해주세요." required /></label><div className="auth-saas__options"><Checkbox checked={remember} onChange={(event) => changeRemember(event.target.checked)}>로그인 상태 유지</Checkbox><Link to="/reset-password">비밀번호 찾기</Link></div>{message && <p className="form-message form-message--error">{message}</p>}<button className="button button--block" disabled={submitting}>{submitting ? '로그인 중...' : '로그인'}</button></form><p className="auth-card__footer">아직 계정이 없나요? <Link to="/signup">회원가입</Link></p></AuthLayout>
}
