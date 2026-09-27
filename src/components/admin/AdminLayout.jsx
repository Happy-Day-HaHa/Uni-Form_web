import { NavLink, Outlet } from 'react-router-dom'
import BrandMark from '../BrandMark'
import { useAuth } from '../../hooks/useAuth'

const links = [['/admin', '홈', true], ['/admin/surveys', '설문'], ['/admin/members', '회원'], ['/admin/teams', '팀'], ['/admin/leaderboard', '리더보드·보상'], ['/admin/logs', '조치 기록']]

export default function AdminLayout() {
  const { profile } = useAuth()
  return <div className="admin-shell"><aside className="admin-sidebar"><NavLink className="admin-sidebar__brand" to="/admin"><BrandMark /><small>ADMIN</small></NavLink><nav aria-label="관리자 메뉴">{links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav><div className="admin-sidebar__foot"><span>운영 계정</span><strong>{profile?.nickname || '관리자'}</strong></div></aside><section className="admin-stage"><header className="admin-topbar"><div><b>Uni-Form 관리자</b><span>서비스 운영 센터</span></div><div><span>{profile?.nickname || '관리자'} 님</span><NavLink to="/dashboard">서비스로 돌아가기</NavLink></div></header><main className="admin-content"><Outlet /></main></section></div>
}
