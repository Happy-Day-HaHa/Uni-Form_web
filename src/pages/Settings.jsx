import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { getProfile, saveProfile } from '../services/userService'

const tabs = [['account', '계정 정보'], ['notifications', '알림 설정'], ['personal', '개인화 설정'], ['service', '서비스 설정'], ['integrations', '연동 서비스'], ['data', '데이터 관리']]
const noticeRows = [['email', '이메일 알림', '설문 참여, 결과 완료 등 주요 알림을 이메일로 받습니다.'], ['push', '푸시 알림', '서비스 내 알림을 실시간으로 받습니다.'], ['marketing', '마케팅 알림', '새로운 기능, 이벤트, 유용한 팁을 받아보세요.']]

export default function Settings() {
  const { user, demoMode } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'account'
  const [profile, setProfile] = useState({ name: '', occupation: '대학생', age_group: '20대', region: '서울', interests: [] })
  const [notices, setNotices] = useState({ email: true, push: true, marketing: false })
  const [pending, setPending] = useState('')
  const [toast, setToast] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  useEffect(() => { getProfile(user.id).then(setProfile).catch(() => {}) }, [user.id])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 1800); return () => window.clearTimeout(timer) }, [toast])
  async function save() { try { await saveProfile({ ...profile, id: user.id }); setToast(demoMode ? '데모 설정을 저장했습니다.' : '변경사항을 저장했습니다.') } catch (error) { setToast(error.message) } }
  function toggle(key) { const before = notices[key]; setNotices((value) => ({ ...value, [key]: !before })); setPending(key); window.setTimeout(() => { setPending(''); setToast('알림 설정을 저장했습니다.') }, 420) }
  function download() {
    const blob = new Blob([JSON.stringify({ profile, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'uniform-data.json'; link.click(); URL.revokeObjectURL(url); setToast('데이터 파일을 준비했습니다.')
  }

  return <ServiceShell activePath="/settings"><div className="settings-page">
    <ServiceHeading icon="⚙" title="설정" description="계정 정보와 서비스 이용 환경을 관리할 수 있습니다." />
    <nav className="settings-tabs" aria-label="설정 메뉴">{tabs.map(([key, label]) => <button key={key} type="button" className={tab === key ? 'is-active' : ''} onClick={() => setParams({ tab: key })}>{label}</button>)}</nav>

    {tab === 'account' && <section className="settings-grid settings-tab-panel">
      <article className="settings-card ui-card"><h2>프로필 정보</h2><p>설문 참여와 결과에 표시되는 기본 정보입니다.</p><div className="profile-layout"><div className="profile-avatar">{profile.name?.[0] || '김'}<button aria-label="프로필 사진 변경">▣</button></div><div className="settings-fields">{[['name', '이름'], ['occupation', '직업/역할'], ['region', '소속']].map(([key, label]) => <label key={key}>{label}<input value={profile[key] || ''} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} /></label>)}<label>이메일<input value={user.email || ''} disabled /></label><label>학년<select value={profile.age_group || '20대'} onChange={(event) => setProfile({ ...profile, age_group: event.target.value })}>{['1학년', '2학년', '3학년', '4학년 이상', '20대'].map((value) => <option key={value}>{value}</option>)}</select></label></div></div></article>
      <div className="settings-stack"><article className="settings-card ui-card"><h2>계정 상태</h2><p>현재 계정과 이용 현황을 확인할 수 있습니다.</p>{[['이용 상태', '정상'], ['가입일', '2024년 8월 12일'], ['최근 접속', '오늘 오후 2:30'], ['이용 플랜', '무료 플랜']].map(([label, value]) => <div className="settings-row" key={label}><strong>{label}</strong><span>{value}</span></div>)}</article><article className="settings-card ui-card"><h2>비밀번호 및 보안</h2><p>계정 보안을 위해 비밀번호를 주기적으로 변경해주세요.</p>{[['비밀번호', '변경하기'], ['2단계 인증', '설정하기'], ['로그인 기록', '확인하기']].map(([label, action]) => <div className="settings-row" key={label}><strong>{label}</strong><button className="mini-button">{action}</button></div>)}</article></div>
    </section>}

    {tab === 'notifications' && <section className="settings-tab-panel settings-grid"><article className="settings-card ui-card settings-card--wide"><h2>알림 설정</h2><p>중요한 활동을 놓치지 않도록 알림을 설정하세요.</p>{noticeRows.map(([key, title, copy]) => <div className="settings-row" key={key}><div><strong>{title}</strong><small>{copy}</small></div><button className={`toggle ${notices[key] ? 'is-on' : ''}`} disabled={pending === key} aria-busy={pending === key} aria-pressed={notices[key]} aria-label={`${title} ${notices[key] ? '끄기' : '켜기'}`} onClick={() => toggle(key)} /></div>)}</article></section>}

    {tab === 'personal' && <section className="settings-tab-panel settings-grid"><article className="settings-card ui-card settings-card--wide"><h2>개인화 설정</h2><p>더 나은 추천과 맞춤 경험을 위한 정보를 설정해주세요.</p><div className="settings-row"><div><strong>관심 카테고리</strong><small>교육, 테크, 라이프스타일</small></div><button className="mini-button">설정하기</button></div><div className="settings-row"><div><strong>설문 추천 설정</strong><small>내 활동을 기반으로 맞춤 설문을 추천합니다.</small></div><button className="toggle is-on" aria-pressed="true" /></div><div className="settings-row"><div><strong>프로필 공개 범위</strong><small>다른 사용자에게 내 프로필을 일부 공개합니다.</small></div><select><option>일부 공개</option><option>비공개</option></select></div></article></section>}

    {tab === 'service' && <section className="settings-tab-panel settings-grid"><article className="settings-card ui-card settings-card--wide"><h2>서비스 설정</h2><p>UniForm의 기본 동작과 표시 방식을 관리합니다.</p><div className="settings-row"><div><strong>기본 설문 공개 범위</strong><small>새 설문에 자동으로 적용됩니다.</small></div><select><option>전체 공개</option><option>학교 공개</option><option>비공개</option></select></div><div className="settings-row"><div><strong>자동 임시 저장</strong><small>FormMate와 편집기의 변경 내용을 자동 저장합니다.</small></div><button className="toggle is-on" aria-pressed="true" /></div></article></section>}

    {tab === 'integrations' && <section className="settings-tab-panel settings-grid"><article className="settings-card ui-card settings-card--wide"><h2>연동 서비스</h2><p>다른 서비스와 연동하여 더 편리하게 이용할 수 있습니다.</p>{[['Google 계정', 'G'], ['Kakao 계정', 'K'], ['Naver 계정', 'N']].map(([label, icon]) => <div className="settings-row" key={label}><div><b className="integration-icon">{icon}</b><strong>{label}</strong><small>연동하지 않음</small></div><button className="mini-button" onClick={() => setToast(`${label} 연동 준비가 완료되었습니다.`)}>연동하기</button></div>)}</article></section>}

    {tab === 'data' && <section className="settings-tab-panel settings-grid"><article className="settings-card ui-card settings-card--wide"><h2>데이터 관리</h2><p>내 데이터를 다운로드하거나 계정을 관리할 수 있습니다.</p><div className="settings-row"><div><strong>내 데이터 다운로드</strong><small>프로필과 설문 데이터를 파일로 받을 수 있습니다.</small></div><button className="mini-button" onClick={download}>다운로드하기</button></div><div className="settings-row"><div><strong>계정 삭제</strong><small>계정과 모든 데이터가 영구적으로 삭제됩니다.</small></div><button className="mini-button mini-button--danger" onClick={() => setDeleteOpen(true)}>계정 삭제하기</button></div></article></section>}

    <div className="settings-save"><button className="ui-button ui-button--secondary" type="button" onClick={() => window.location.reload()}>변경사항 취소</button><button className="ui-button" type="button" onClick={save}>변경사항 저장</button></div>
    <Modal open={deleteOpen} title="계정을 삭제할까요?" onClose={() => { setDeleteOpen(false); setDeleteText('') }}><p>이 작업은 되돌릴 수 없습니다. 계속하려면 아래에 <b>삭제</b>를 입력하세요.</p><input className="service-input" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder="삭제" /><div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setDeleteOpen(false)}>취소</button><button className="ui-button ui-button--danger" disabled={deleteText !== '삭제'} onClick={() => setToast('데모에서는 계정이 삭제되지 않습니다.')}>계정 삭제</button></div></Modal>
    {toast && <div className="service-toast" role="status">✓ {toast}</div>}
  </div></ServiceShell>
}
