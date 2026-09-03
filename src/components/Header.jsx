import { Link, NavLink } from 'react-router-dom'
import { usePoints } from '../hooks/usePoints'
import { useAuth } from '../hooks/useAuth'
import PointBadge from './PointBadge'
import BrandMark from './BrandMark'

export default function Header() {
  const { user } = useAuth()
  const { points } = usePoints()
  return <header className="app-header"><Link to="/"><BrandMark /></Link><nav><NavLink to="/surveys">설문 찾기</NavLink>{user && <NavLink to="/dashboard">내 설문</NavLink>}{user && <NavLink to="/profile">프로필</NavLink>}</nav><Link className="app-create-button" to="/surveys/create">+ 만들기</Link>{user ? <PointBadge points={points} /> : <Link className="header-login" to="/login">로그인</Link>}</header>
}
