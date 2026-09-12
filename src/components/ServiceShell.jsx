import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../services/authService'
import { getMySurveys } from '../services/surveyService'
import '../styles/service-shell.css'

const navItems = [
  ['/formmate', '✦', 'FormMate'],
  ['/dashboard', '⌂', '대시보드'],
  ['/my-surveys', '▤', '내 설문'],
  ['/surveys', '▣', '설문 목록'],
  ['/reports', '▥', '결과 보고서'],
  ['/settings', '⚙', '설정'],
]

const notifications = [
  ['새 응답이 5건 도착했습니다.', 'AI 서비스 사용 경험 조사'],
  ['목표 응답 수를 달성했습니다.', '친환경 소비 선택 조사'],
  ['설문 분석이 준비되었습니다.', '캠퍼스 생활 만족도 조사'],
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

function relativeTime(value, index) {
  if (!value) return ['방금 수정됨', '1시간 전', '3일 전', '1주 전'][Math.min(index, 3)]
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 2) return '방금 수정됨'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / 1440)}일 전`
}

export default function ServiceShell({ children, activePath }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || '유니폼'
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('uniform-sidebar-collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menu, setMenu] = useState('')
  const [recent, setRecent] = useState([])
  const popupRef = useRef(null)

  useEffect(() => { localStorage.setItem('uniform-sidebar-collapsed', collapsed ? '1' : '0') }, [collapsed])
  useEffect(() => {
    if (!user?.id) return undefined
    let active = true
    getMySurveys(user.id).then((items) => active && setRecent(items.slice(0, 5))).catch(() => active && setRecent([]))
    return () => { active = false }
  }, [user?.id])
  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape') { setMobileOpen(false); setMenu('') }
      if (event.type === 'pointerdown' && popupRef.current && !popupRef.current.contains(event.target)) setMenu('')
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close)
    return () => { window.removeEventListener('keydown', close); window.removeEventListener('pointerdown', close) }
  }, [])

  async function signOut() {
    await logout().catch(() => {})
    setMenu('')
    navigate('/')
  }

  return <div className={`service-shell ${collapsed ? 'service-shell--collapsed' : ''} ${mobileOpen ? 'service-shell--mobile-open' : ''}`}>
    <button className="service-drawer-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />
    <aside className="service-sidebar" aria-label="서비스 사이드바">
      <Link className="service-sidebar__brand" to="/"><BrandMark /></Link>
      <nav aria-label="서비스 메뉴">{navItems.map(([to, icon, label], index) => <div key={to} className={index === 1 ? 'service-nav-break' : ''}><NavLink to={to} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => (isActive || activePath === to) ? 'active' : ''}><span aria-hidden="true">{icon}</span><b>{label}</b>{index === 0 && <i>›</i>}</NavLink></div>)}</nav>
      <section className="service-recent" aria-label="최근 작업">
        <header><span>최근 작업</span><Link to="/formmate?new=true" aria-label="FormMate 새 작업 시작">＋</Link></header>
        <div>{recent.length ? recent.map((survey, index) => <Link key={survey.id} to={`/my-surveys?survey=${survey.id}`} title={survey.title}><span>▤</span><p><b>{survey.title}</b><small>{relativeTime(survey.updated_at || survey.created_at, index)}</small></p></Link>) : <p className="service-recent__empty">최근 작업이 없습니다.</p>}</div>
        <Link className="service-recent__more" to="/my-surveys">더보기⌄</Link>
      </section>
      <Link className="service-support" to="/settings?tab=service"><span>?</span><b>고객센터</b></Link>
      <button className="service-sidebar__collapse" type="button" aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '›' : '‹'}<span>{collapsed ? '펼치기' : '접기'}</span></button>
    </aside>
    <div className="service-stage"><header className="service-topbar"><button className="service-menu-button" type="button" aria-label="메뉴 열기" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>☰</button><Link className="service-mobile-brand" to="/"><BrandMark /></Link><div className="service-topbar__actions" ref={popupRef}>
      <button className="service-help" type="button" onClick={() => setMenu(menu === 'help' ? '' : 'help')} aria-expanded={menu === 'help'}><span>?</span>도움말</button>
      <button className="service-notice" type="button" aria-label="알림" aria-expanded={menu === 'notice'} onClick={() => setMenu(menu === 'notice' ? '' : 'notice')}>●</button>
      <button className="service-user" type="button" aria-expanded={menu === 'profile'} onClick={() => setMenu(menu === 'profile' ? '' : 'profile')}><span>{name.slice(0, 1).toUpperCase()}</span><b>{name}님</b><i>⌄</i></button>
      {menu === 'help' && <div className="service-popover service-popover--help" role="dialog"><strong>무엇을 도와드릴까요?</strong><Link to="/formmate">FormMate 사용법</Link><Link to="/surveys">설문 참여 안내</Link><Link to="/settings?tab=service">고객센터</Link></div>}
      {menu === 'notice' && <div className="service-popover service-popover--notice" role="dialog"><header><strong>알림</strong><button type="button" onClick={() => setMenu('')}>모두 읽음</button></header>{notifications.map(([title, copy]) => <Link to="/reports" key={title}><i /><p><b>{title}</b><small>{copy}</small></p></Link>)}</div>}
      {menu === 'profile' && <div className="service-popover service-popover--profile" role="menu"><Link role="menuitem" to="/settings">프로필</Link><Link role="menuitem" to="/settings">설정</Link><button role="menuitem" type="button" onClick={signOut}>로그아웃</button></div>}
    </div></header><main className="service-content motion-page">{children}</main></div>
  </div>
}

export function ServiceHeading({ icon, title, description, action }) {
  return <header className="service-heading" data-motion-reveal><span aria-hidden="true">{icon}</span><div><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

export function MetricCard({ tone = 'blue', icon, label, value, unit = '', note, to }) {
  const displayValue = useCountUp(value)
  const content = <><span className={`service-metric__icon service-tone--${tone}`}>{icon}</span><div><small>{label}</small><strong>{displayValue.toLocaleString()}<em>{unit}</em></strong><p>{note}</p></div>{to && <b className="service-metric__arrow">›</b>}</>
  return to ? <Link className="service-metric ui-card" data-clickable="true" data-motion-reveal to={to}>{content}</Link> : <article className="service-metric ui-card" data-motion-reveal>{content}</article>
}
