import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

export default function AuthLayout({ mode, children }) {
  const isLogin = mode === 'login'
  return <main className="auth-saas motion-page">
    <header className="auth-saas__header"><Link to="/"><BrandMark /></Link><Link to={isLogin ? '/signup' : '/login'}>{isLogin ? '회원가입' : '로그인'}</Link></header>
    <section className={`auth-saas__card ${isLogin ? '' : 'auth-saas__card--signup'}`}>{children}</section>
  </main>
}
