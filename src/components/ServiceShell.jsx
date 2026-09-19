import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BrandMark from './BrandMark'
import '../styles/service-shell.css'

const navItems = [
  ['/dashboard', '대시보드'],
  ['/my-surveys', '내 설문'],
  ['/formmate', '설문 만들기'],
  ['/surveys', '설문 목록'],
  ['/reports', '결과 보기'],
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
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('uniform-sidebar-collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { localStorage.setItem('uniform-sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])
  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  function openMenu() {
    if (window.matchMedia('(max-width: 780px)').matches) setMobileOpen(true)
    else setCollapsed(false)
  }

  return <div className={`service-shell ${collapsed ? 'service-shell--collapsed' : ''} ${mobileOpen ? 'service-shell--mobile-open' : ''}`}>
    <button className="service-drawer-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />
    <aside className="service-sidebar" aria-label="서비스 사이드바">
      <Link className="service-sidebar__brand" to="/"><BrandMark /></Link>
      <nav aria-label="서비스 메뉴">{navItems.map(([to, label]) => {
        const currentPath = activePath || location.pathname
        return <NavLink key={to} to={to} end onClick={() => setMobileOpen(false)} className={() => currentPath === to ? 'active' : ''}>{label}</NavLink>
      })}</nav>
      <button className="service-sidebar__collapse" type="button" onClick={() => setCollapsed(true)}>사이드바 숨기기</button>
    </aside>
    <div className="service-stage"><header className="service-topbar"><button className="service-menu-button" type="button" aria-label="메뉴 열기" aria-expanded={mobileOpen || !collapsed} onClick={openMenu}>메뉴</button><Link className="service-mobile-brand" to="/"><BrandMark /></Link><Link className="service-help" to="/support">고객센터</Link></header><main className="service-content motion-page">{children}</main></div>
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
