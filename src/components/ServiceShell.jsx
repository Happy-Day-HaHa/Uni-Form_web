import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'
import Modal from './Modal'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../services/authService'
import '../styles/service-shell.css'

const navItems = [
  ['/dashboard', '대시보드'],
  ['/my-surveys', '내 설문'],
  ['/my-responses', '내 응답'],
  ['/formmate', '설문 만들기'],
  ['/surveys', '설문 목록'],
  ['/team', '팀 관리'],
  ['/leaderboard', '리더보드'],
  ['/settings', '설정'],
]

function useCountUp(value) {
  const target = Number(value) || 0
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCurrent(target); return undefined }
    let frame
    const started = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / 580)
      setCurrent(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return current
}

export default function ServiceShell({ children, activePath }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setLoggingOut(false)
      setLogoutConfirmOpen(false)
    }
  }
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('uniform-sidebar-collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 780px)').matches)
  const sidebarOpen = isMobile ? mobileOpen : !collapsed

  useEffect(() => { localStorage.setItem('uniform-sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])
  useEffect(() => {
    const query = window.matchMedia('(max-width: 780px)')
    const sync = () => setIsMobile(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  // 상단 토글: PC는 사이드바 접기/펼치기, 모바일은 서랍 열기/닫기.
  function toggleMenu() {
    if (isMobile) setMobileOpen((open) => !open)
    else setCollapsed((value) => !value)
  }

  return <div className={`service-shell ${collapsed ? 'service-shell--collapsed' : ''} ${mobileOpen ? 'service-shell--mobile-open' : ''}`}>
    <button className="service-drawer-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />
    {/* 토글 + 로고는 사이드바 열림/닫힘과 관계없이 왼쪽 위 같은 자리에 고정한다. */}
    <div className="service-corner"><button className="service-menu-button" type="button" aria-label={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'} aria-expanded={sidebarOpen} onClick={toggleMenu}><span className="service-menu-button__icon" aria-hidden="true"><i /><i /></span></button><Link className="service-corner__brand" to="/" onClick={() => setMobileOpen(false)}><BrandMark /></Link></div>
    <aside className="service-sidebar" aria-label="서비스 사이드바">
      <nav aria-label="서비스 메뉴">{navItems.map(([to, label]) => {
        const currentPath = activePath || location.pathname
        return <NavLink key={to} to={to} end onClick={() => setMobileOpen(false)} className={() => currentPath === to ? 'active' : ''}>{label}</NavLink>
      })}{profile?.role === 'ADMIN' && <NavLink to="/admin" className="service-sidebar__admin">관리자</NavLink>}</nav>
    </aside>
    <div className="service-stage"><header className="service-topbar"><Link className="service-help" to="/support">고객센터</Link><button className="service-logout" type="button" onClick={() => setLogoutConfirmOpen(true)}>로그아웃</button></header><main className="service-content motion-page">{children}</main></div>
    <Modal open={logoutConfirmOpen} title="로그아웃할까요?" onClose={() => !loggingOut && setLogoutConfirmOpen(false)}><p className="service-logout-confirm">로그아웃하면 다시 로그인해야 서비스를 이용할 수 있어요.</p><div className="modal-actions"><button className="ui-button ui-button--secondary" type="button" disabled={loggingOut} onClick={() => setLogoutConfirmOpen(false)}>취소</button><button className="ui-button service-logout-confirm__ok" type="button" disabled={loggingOut} onClick={handleLogout}>{loggingOut ? '로그아웃 중…' : '로그아웃'}</button></div></Modal>
  </div>
}

export function ServiceHeading({ icon, title, description, action }) {
  return <header className="service-heading" data-motion-reveal><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

export function MetricCard({ tone = 'blue', icon, label, value, unit = '', note, to }) {
  const displayValue = useCountUp(value)
  const content = <><div><small>{label}</small><strong>{displayValue.toLocaleString()}<em>{unit}</em></strong><p>{note}</p></div></>
  return to ? <Link className="service-metric ui-card" data-clickable="true" data-motion-reveal to={to}>{content}</Link> : <article className="service-metric ui-card" data-motion-reveal>{content}</article>
}
