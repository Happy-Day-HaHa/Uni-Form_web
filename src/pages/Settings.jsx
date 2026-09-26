import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { getProfile, saveProfile } from '../services/userService'

const tabs = [['account', '계정 및 보안'], ['notifications', '알림'], ['data', '데이터 관리']]
const noticeRows = [['email', '이메일 알림', '설문 참여, 결과 완료 등 주요 알림을 이메일로 받습니다.'], ['push', '푸시 알림', '서비스 내 알림을 실시간으로 받습니다.'], ['marketing', '마케팅 알림', '새로운 기능, 이벤트, 유용한 팁을 받아보세요.']]

export default function Settings() {
  const { user, demoMode } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'account'
  const [profile, setProfile] = useState({ nickname: '', gender: '응답하지 않음', grade: '해당 없음', major: '해당 없음', enrollment_status: '해당 없음' })
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

    {tab === 'account' && <section className="settings-tab-panel settings-sections">
      <article className="settings-section"><header><h2>프로필 정보</h2><p>설문 참여와 결과에 표시되는 기본 정보입니다.</p></header><div className="settings-fields"><label>닉네임<input value={profile.nickname || ''} onChange={(event) => setProfile({ ...profile, nickname: event.target.value })} /></label><label>성별<select value={profile.gender || '응답하지 않음'} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}>{['남성', '여성', '응답하지 않음'].map((value) => <option key={value}>{value}</option>)}</select></label><label>학년<select value={profile.grade || '해당 없음'} onChange={(event) => setProfile({ ...profile, grade: event.target.value })}>{['1학년', '2학년', '3학년', '4학년 이상', '대학원', '해당 없음'].map((value) => <option key={value}>{value}</option>)}</select></label><label>전공 계열<select value={profile.major || '해당 없음'} onChange={(event) => setProfile({ ...profile, major: event.target.value })}>{['인문사회', '상경', '공학', '자연과학', '의약', '예체능', '교육', '해당 없음'].map((value) => <option key={value}>{value}</option>)}</select></label><label>재학 상태<select value={profile.enrollment_status || '해당 없음'} onChange={(event) => setProfile({ ...profile, enrollment_status: event.target.value })}>{['재학', '휴학', '졸업', '해당 없음'].map((value) => <option key={value}>{value}</option>)}</select></label></div></article>
      <article className="settings-section"><header><h2>계정 및 보안</h2><p>로그인과 계정 보안 설정을 관리합니다.</p></header>{[['비밀번호', '변경하기'], ['2단계 인증', '설정하기'], ['로그인 기록', '확인하기']].map(([label, action]) => <div className="settings-row" key={label}><strong>{label}</strong><button className="mini-button">{action}</button></div>)}</article>
    </section>}

    {tab === 'notifications' && <section className="settings-tab-panel settings-sections"><article className="settings-section"><header><h2>알림 설정</h2><p>중요한 활동을 놓치지 않도록 알림을 설정하세요.</p></header>{noticeRows.map(([key, title, copy]) => <div className="settings-row" key={key}><div><strong>{title}</strong><small>{copy}</small></div><button className={`toggle ${notices[key] ? 'is-on' : ''}`} disabled={pending === key} aria-busy={pending === key} aria-pressed={notices[key]} aria-label={`${title} ${notices[key] ? '끄기' : '켜기'}`} onClick={() => toggle(key)} /></div>)}</article></section>}

    {tab === 'data' && <section className="settings-tab-panel settings-sections"><article className="settings-section"><header><h2>데이터 관리</h2><p>내 데이터를 다운로드하거나 계정을 관리할 수 있습니다.</p></header><div className="settings-row"><div><strong>내 데이터 다운로드</strong><small>프로필과 설문 데이터를 파일로 받을 수 있습니다.</small></div><button className="mini-button" onClick={download}>다운로드하기</button></div><div className="settings-row"><div><strong>계정 삭제</strong><small>계정과 모든 데이터가 영구적으로 삭제됩니다.</small></div><button className="mini-button mini-button--danger" onClick={() => setDeleteOpen(true)}>계정 삭제하기</button></div></article></section>}

    <div className="settings-save"><button className="ui-button ui-button--secondary" type="button" onClick={() => window.location.reload()}>변경사항 취소</button><button className="ui-button" type="button" onClick={save}>변경사항 저장</button></div>
    <Modal open={deleteOpen} title="계정을 삭제할까요?" onClose={() => { setDeleteOpen(false); setDeleteText('') }}><p>이 작업은 되돌릴 수 없습니다. 계속하려면 아래에 <b>삭제</b>를 입력하세요.</p><input className="service-input" value={deleteText} onChange={(event) => setDeleteText(event.target.value)} placeholder="삭제" /><div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setDeleteOpen(false)}>취소</button><button className="ui-button ui-button--danger" disabled={deleteText !== '삭제'} onClick={() => setToast('데모에서는 계정이 삭제되지 않습니다.')}>계정 삭제</button></div></Modal>
    {toast && <div className="service-toast" role="status">✓ {toast}</div>}
  </div></ServiceShell>
}
