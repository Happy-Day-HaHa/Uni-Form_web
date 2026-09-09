import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

const benefits = [
  ['◎', '누구나 간편하게', '일반 이메일로 가입하고 바로 설문을 시작할 수 있어요.'],
  ['▥', '하나로 이어지는 흐름', '참여, 제작, 결과 확인을 한곳에서 이어갑니다.'],
  ['◇', '안전한 정보 관리', '소중한 응답과 계정 정보를 안전하게 다룹니다.'],
]

export default function AuthLayout({ mode, children }) {
  const isLogin = mode === 'login'
  return <main className="auth-saas motion-page">
    <header className="auth-saas__header"><Link to="/"><BrandMark /></Link><div><Link to={isLogin ? '/signup' : '/login'}>{isLogin ? '회원가입' : '로그인'}</Link><Link className="auth-saas__header-button" to={isLogin ? '/login' : '/signup'}>{isLogin ? '로그인' : '회원가입'}</Link></div></header>
    <aside className="auth-saas__benefits"><h2>복잡한 설문 과정을<br />더 간단하게 만듭니다.</h2><p>UniForm은 더 많은 의견을 편하게 모으고 이해할 수 있는 설문 환경을 제공합니다.</p><ul>{benefits.map(([icon, title, copy]) => <li key={title}><span>{icon}</span><div><b>{title}</b><small>{copy}</small></div></li>)}</ul></aside>
    <section className={`auth-saas__card ${isLogin ? '' : 'auth-saas__card--signup'}`}>{children}</section>
    <aside className="auth-saas__quote"><span>“</span><h2>작은 질문이<br />더 나은 선택을 만듭니다.</h2><p>지금 UniForm에서 필요한 의견을 편하게 모아보세요.</p><i><b /></i></aside>
  </main>
}
