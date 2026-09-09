import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../hooks/useAuth'
import '../styles/service-shell.css'

function useCountUp(value, enabled) {
  const target = Number(value) || 0
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(target)
      return undefined
    }
    const startedAt = performance.now()
    let frame
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / 520)
      setDisplayValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [enabled, target])

  return enabled ? displayValue : target
}

const navItems = [
  ['/dashboard', '⌂', '대시보드'],
  ['/my-surveys', '▤', '내 설문'],
  ['/surveys', '▣', '설문 목록'],
  ['/reports', '▥', '결과 보고서'],
  ['/activity', '◷', '활동 내역'],
  ['/settings', '⚙', '설정'],
]

export default function ServiceShell({ children, activePath }) {
  const { user } = useAuth()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || '유니폼'
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('uniform-sidebar-collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => { localStorage.setItem('uniform-sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  return (
    <div className={`service-shell ${collapsed ? 'service-shell--collapsed' : ''} ${mobileOpen ? 'service-shell--mobile-open' : ''}`}>
      <button className="service-drawer-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />
      <aside className="service-sidebar" aria-label="서비스 사이드바">
        <Link className="service-sidebar__brand" to="/"><BrandMark /></Link>
        <nav aria-label="서비스 메뉴">
          {navItems.map(([to, icon, label]) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => (isActive || activePath === to) ? 'active' : ''}>
              <span aria-hidden="true">{icon}</span><b>{label}</b>
            </NavLink>
          ))}
        </nav>
        <div className="service-sidebar__cta">
          <span aria-hidden="true">✦</span>
          <strong>좋은 설문은<br />작은 질문에서 시작돼요.</strong>
          <p>FormMate와 함께 필요한 질문을 빠르게 완성해보세요.</p>
          <Link to="/surveys/create">새 설문 만들기 <b>→</b></Link>
        </div>
        <button className="service-sidebar__collapse" type="button" aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '›' : '‹'}<span>{collapsed ? '펼치기' : '접기'}</span></button>
      </aside>
      <div className="service-stage">
        <header className="service-topbar">
          <button className="service-menu-button" type="button" aria-label="메뉴 열기" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>☰</button>
          <Link className="service-mobile-brand" to="/"><BrandMark /></Link>
          <Link className="service-notice" to="/activity" aria-label="최근 활동">●</Link>
          <Link className="service-user" to="/settings"><span>{name.slice(0, 1).toUpperCase()}</span><b>{name}님</b><i>⌄</i></Link>
        </header>
        <main className="service-content motion-page">{children}</main>
      </div>
    </div>
  )
}

export function ServiceHeading({ icon, title, description, action }) {
  return <header className="service-heading" data-motion-reveal><span aria-hidden="true">{icon}</span><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

export function MetricCard({ tone = 'blue', icon, label, value, unit = '', note, animate = false }) {
  const displayValue = useCountUp(value, animate)
  return <article className="service-metric ui-card" data-motion-reveal><span className={`service-metric__icon service-tone--${tone}`}>{icon}</span><div><small>{label}</small><strong>{displayValue.toLocaleString()}<em>{unit}</em></strong><p>{note}</p></div></article>
}
