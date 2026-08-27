import { NavLink } from 'react-router-dom'
import { usePoints } from '../hooks/usePoints'
import PointBadge from './PointBadge'
import BrandMark from './BrandMark'

export default function Header() {
  const { points } = usePoints()
  return <header className="app-header"><BrandMark /><nav><NavLink to="/surveys">설문 찾기</NavLink><NavLink to="/surveys/create">설문 만들기</NavLink><NavLink to="/dashboard">대시보드</NavLink><NavLink to="/profile">프로필</NavLink></nav><PointBadge points={points} /></header>
}
