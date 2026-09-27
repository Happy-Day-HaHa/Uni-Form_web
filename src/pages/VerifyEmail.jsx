import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function VerifyEmail() {
  const { state } = useLocation()
  return <AuthLayout mode="login"><div className="auth-saas__title"><div><h1>이메일을 확인해주세요</h1><p><b>{state?.email || '가입한 이메일'}</b>로 인증 링크를 보냈습니다.</p></div></div><div className="demo-note">메일함의 링크를 눌러 인증을 마친 뒤 로그인해주세요. 메일이 보이지 않으면 스팸함도 확인해주세요.</div><Link className="button button--block" to="/login">로그인으로 이동</Link></AuthLayout>
}
