import { useState } from 'react'
import Modal from '../components/Modal'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import '../styles/admin.css'

const tabs = [['surveys', '설문 관리'], ['members', '회원 관리'], ['leaderboard', '리더보드 관리'], ['rewards', '보상 관리']]

const initialSurveys = [
  { id: 's1', title: '대학생의 AI 서비스 사용 경험 조사', author: '오지안', status: '모집 중', responses: 341, reportStatus: '정상' },
  { id: 's2', title: '학교 커뮤니티 사용 경험 설문', author: '전민서', status: '모집 중', responses: 288, reportStatus: '신고 1건' },
  { id: 's3', title: '친환경 소비 선택 조사', author: '박도현', status: '마감', responses: 154, reportStatus: '정상' },
  { id: 's4', title: '온라인 강의 집중도 조사', author: '이서진', status: '모집 중', responses: 279, reportStatus: '정상' },
]
const initialMembers = [
  { id: 'u1', nickname: '하윤서', email: 'yoonseo@uni.ac.kr', joinedAt: '2026-03-02', status: '정상' },
  { id: 'u2', nickname: '최은우', email: 'eunwoo@uni.ac.kr', joinedAt: '2026-04-18', status: '정상' },
  { id: 'u3', nickname: 'ee_nam', email: 'nam@uni.ac.kr', joinedAt: '2026-02-10', status: '이용 제한' },
]
const initialScores = [
  { id: 'u1', nickname: '하윤서', score: 132 },
  { id: 'u4', nickname: '박도현', score: 129 },
  { id: 'u5', nickname: '이서진', score: 124 },
]
const initialRewards = [
  { id: 'r1', rank: 1, nickname: '하윤서', status: '발송 완료' },
  { id: 'r2', rank: 2, nickname: '박도현', status: '대기' },
  { id: 'r3', rank: 3, nickname: '이서진', status: '대기' },
]

export default function Admin() {
  const [tab, setTab] = useState('surveys')
  const [surveys, setSurveys] = useState(initialSurveys)
  const [members, setMembers] = useState(initialMembers)
  const [scores, setScores] = useState(initialScores)
  const [rewards, setRewards] = useState(initialRewards)
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [deductAmount, setDeductAmount] = useState('1')
  const [toast, setToast] = useState('')

  function openAction(type, target) { setAction({ type, target }); setReason(''); setDeductAmount('1') }
  function closeAction() { setAction(null) }
  function notify(message) { setToast(message); window.setTimeout(() => setToast(''), 1800) }

  function confirmAction() {
    if (!reason.trim()) return
    if (action.type === 'remove-survey') {
      setSurveys((current) => current.map((survey) => survey.id === action.target.id ? { ...survey, status: '운영 삭제' } : survey))
      notify('설문을 운영 삭제 처리했습니다.')
    } else if (action.type === 'restrict-member') {
      setMembers((current) => current.map((member) => member.id === action.target.id ? { ...member, status: member.status === '이용 제한' ? '정상' : '이용 제한' } : member))
      notify('회원 상태를 변경했습니다.')
    } else if (action.type === 'deduct-score') {
      const amount = Math.max(0, Number(deductAmount) || 0)
      setScores((current) => current.map((entry) => entry.id === action.target.id ? { ...entry, score: Math.max(0, entry.score - amount) } : entry))
      notify(`${action.target.nickname}님의 점수를 ${amount}점 차감했습니다.`)
    }
    closeAction()
  }

  function markRewardSent(id) {
    setRewards((current) => current.map((reward) => reward.id === id ? { ...reward, status: '발송 완료' } : reward))
    notify('발송 완료로 처리했습니다.')
  }

  return <ServiceShell activePath="/admin"><div>
    <ServiceHeading icon="◆" title="관리자" description="설문, 회원, 리더보드, 보상 현황을 관리합니다." />
    <nav className="settings-tabs" aria-label="관리자 메뉴">{tabs.map(([key, label]) => <button key={key} type="button" className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>

    {tab === 'surveys' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>설문</th><th>작성자</th><th>상태</th><th>응답 수</th><th>신고/관리 상태</th><th /></tr></thead><tbody>{surveys.map((survey) => <tr key={survey.id}><td>{survey.title}</td><td>{survey.author}</td><td><span className={`admin-badge admin-badge--${survey.status === '운영 삭제' ? 'danger' : survey.status === '모집 중' ? 'active' : 'muted'}`}>{survey.status}</span></td><td>{survey.responses.toLocaleString()}</td><td>{survey.reportStatus !== '정상' ? <span className="admin-badge admin-badge--warn">{survey.reportStatus}</span> : survey.reportStatus}</td><td>{survey.status !== '운영 삭제' && <button className="mini-button mini-button--danger" type="button" onClick={() => openAction('remove-survey', survey)}>운영 삭제</button>}</td></tr>)}</tbody></table></div>}

    {tab === 'members' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>닉네임</th><th>이메일</th><th>가입일</th><th>상태</th><th /></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td>{member.nickname}</td><td>{member.email}</td><td>{member.joinedAt}</td><td><span className={`admin-badge admin-badge--${member.status === '이용 제한' ? 'danger' : 'active'}`}>{member.status}</span></td><td><button className="mini-button" type="button" onClick={() => openAction('restrict-member', member)}>{member.status === '이용 제한' ? '제한 해제' : '이용 제한'}</button></td></tr>)}</tbody></table></div>}

    {tab === 'leaderboard' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>닉네임</th><th>이번 주 점수</th><th /></tr></thead><tbody>{scores.map((entry) => <tr key={entry.id}><td>{entry.nickname}</td><td>{entry.score.toLocaleString()}점</td><td><button className="mini-button mini-button--danger" type="button" onClick={() => openAction('deduct-score', entry)}>점수 차감</button></td></tr>)}</tbody></table></div>}

    {tab === 'rewards' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>순위</th><th>닉네임</th><th>발송 상태</th><th /></tr></thead><tbody>{rewards.map((reward) => <tr key={reward.id}><td>{reward.rank}위</td><td>{reward.nickname}</td><td><span className={`admin-badge admin-badge--${reward.status === '발송 완료' ? 'active' : 'muted'}`}>{reward.status}</span></td><td>{reward.status !== '발송 완료' && <button className="mini-button" type="button" onClick={() => markRewardSent(reward.id)}>발송 완료 처리</button>}</td></tr>)}</tbody></table></div>}

    <Modal open={Boolean(action)} title={action?.type === 'deduct-score' ? '점수를 차감할까요?' : action?.type === 'restrict-member' ? '이용 제한 상태를 변경할까요?' : '설문을 운영 삭제할까요?'} onClose={closeAction}>
      {action?.type === 'deduct-score' && <label className="admin-modal-field">차감 점수<input className="service-input" type="number" min="0" value={deductAmount} onChange={(event) => setDeductAmount(event.target.value)} /></label>}
      <label className="admin-modal-field">조치 사유<textarea className="service-input" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="조치 사유를 입력해주세요." /></label>
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeAction}>취소</button><button className="ui-button ui-button--danger" disabled={!reason.trim()} onClick={confirmAction}>확인</button></div>
    </Modal>
    {toast && <div className="service-toast" role="status">{toast}</div>}
  </div></ServiceShell>
}
