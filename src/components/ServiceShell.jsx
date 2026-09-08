import { Link, NavLink } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../hooks/useAuth'
import '../styles/service-shell.css'

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
  return (
    <div className="service-shell">
      <aside className="service-sidebar">
        <Link className="service-sidebar__brand" to="/"><BrandMark /></Link>
        <nav aria-label="서비스 메뉴">
          {navItems.map(([to, icon, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive || activePath === to) ? 'active' : ''}>
              <span aria-hidden="true">{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="service-sidebar__cta">
          <span aria-hidden="true">✦</span>
          <strong>좋은 설문은<br />작은 질문에서 시작돼요.</strong>
          <p>FormMate와 함께 필요한 질문을 빠르게 완성해보세요.</p>
          <Link to="/surveys/create">새 설문 만들기 <b>→</b></Link>
        </div>
      </aside>
      <div className="service-stage">
        <header className="service-topbar">
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

export function MetricCard({ tone = 'blue', icon, label, value, unit = '', note }) {
  return <article className="service-metric ui-card" data-motion-reveal><span className={`service-metric__icon service-tone--${tone}`}>{icon}</span><div><small>{label}</small><strong>{value.toLocaleString()}<em>{unit}</em></strong><p>{note}</p></div></article>
}
