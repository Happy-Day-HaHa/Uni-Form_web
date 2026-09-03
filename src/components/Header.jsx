import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BrandMark from './BrandMark'

export default function Header() {
  const { user } = useAuth()
  return <header className="app-header"><Link to="/" aria-label="UNI-FORM 홈"><BrandMark /></Link><nav><NavLink to="/surveys">설문 찾기</NavLink>{user && <NavLink to="/dashboard">내 설문</NavLink>}{user && <NavLink to="/profile">프로필</NavLink>}</nav><Link className="app-create-button" to="/surveys/create">+ 만들기</Link>{!user && <Link className="header-login" to="/login">로그인</Link>}</header>
}
