import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { verifyEmail } from '../services/authService'

// 가입하면 인증 메일의 링크(/verify-email?token=...)로 들어와 자동으로 인증한다.
// 토큰 없이 들어오면(회원가입 직후 등) 메일함을 확인하라는 안내만 보여준다.
export default function VerifyEmail() {
  const { state } = useLocation()
  const [searchParams] = useSearchParams()
  const linkToken = searchParams.get('token')
  const [status, setStatus] = useState(linkToken ? 'verifying' : 'idle')
  const [message, setMessage] = useState('')
  const requested = useRef(false)

  useEffect(() => {
    // 토큰은 1회용이라 StrictMode의 이중 실행으로 두 번 보내지 않는다.
    if (!linkToken || requested.current) return
    requested.current = true
    verifyEmail(linkToken)
      .then(() => setStatus('done'))
      .catch((error) => { setMessage(error.message); setStatus('error') })
  }, [linkToken])

  if (status === 'done') return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>이메일 인증 완료</h1><p>이제 로그인해서 UniForm을 시작할 수 있어요.</p></div></div><Link className="button button--block" to="/login">로그인으로 이동</Link></AuthLayout>
  if (status === 'verifying') return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>이메일 인증 중</h1><p>잠시만 기다려주세요.</p></div></div></AuthLayout>
  if (status === 'error') return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>이메일 인증 실패</h1><p>인증 링크가 올바르지 않거나 만료되었습니다.</p></div></div><p className="form-message form-message--error">{message}</p><Link className="button button--block" to="/login">로그인으로 이동</Link></AuthLayout>
  return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>이메일을 확인해주세요</h1><p><b>{state?.email || '가입한 이메일'}</b>로 인증 링크를 보냈습니다.</p></div></div><div className="demo-note">메일함의 링크를 눌러 인증을 마친 뒤 로그인해주세요. 메일이 보이지 않으면 스팸함도 확인해주세요.</div><Link className="button button--block" to="/login">로그인으로 이동</Link></AuthLayout>
}
