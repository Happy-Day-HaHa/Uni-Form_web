import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { MAX_TEAM_SIZE, createTeam, disbandTeam, getMyTeam, removeMember } from '../services/teamService'
import '../styles/team.css'

function relativeTime(value) {
  if (!value) return '방금 전'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 2) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / 1440)}일 전`
}

export default function Team() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nameInput, setNameInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState('')
  const [disbandOpen, setDisbandOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const rootRef = useReveal([loading, team?.id])

  useEffect(() => { getMyTeam().then(setTeam).finally(() => setLoading(false)) }, [])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 1800); return () => window.clearTimeout(timer) }, [toast])

  async function handleCreate(event) {
    event.preventDefault()
    if (nameInput.trim().length < 2) return setToast('팀 이름을 2자 이상 입력해주세요.')
    setCreating(true)
    const created = await createTeam(nameInput, user.id, user.user_metadata?.name || '나')
    setTeam(created)
    setCreating(false)
  }

  async function copyInvite() {
    try { await navigator.clipboard.writeText(team.inviteLink); setToast('초대 링크를 복사했습니다.') } catch { setToast('주소를 직접 복사해주세요.') }
  }

  async function confirmRemove() {
    const next = await removeMember(removeTarget.id)
    setTeam(next)
    setToast(`${removeTarget.nickname}님을 팀에서 내보냈습니다.`)
    setRemoveTarget(null)
  }

  async function confirmDisband() {
    await disbandTeam()
    setTeam(null)
    setDisbandOpen(false)
    setToast('팀을 해체했습니다.')
  }

  if (loading) return <ServiceShell activePath="/team"><div className="team-skeleton" aria-label="팀 정보를 불러오는 중">{[0, 1, 2].map((item) => <div className="skeleton-block" key={item} />)}</div></ServiceShell>

  if (!team) {
    return <ServiceShell activePath="/team"><div ref={rootRef}>
      <ServiceHeading icon="⌘" title="팀 관리" description="팀장 포함 최대 6명까지, 함께 설문을 만들고 관리할 수 있어요." />
      <section className="team-empty ui-card" data-motion-reveal>
        <h2>아직 소속된 팀이 없어요.</h2>
        <p>팀을 만들면 팀원을 초대해 설문을 함께 제작할 수 있습니다.</p>
        <form onSubmit={handleCreate}>
          <input className="service-input" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="팀 이름을 입력하세요." aria-label="팀 이름" />
          <button className="ui-button" type="submit" disabled={creating}>{creating ? '만드는 중…' : '팀 만들기'}</button>
        </form>
      </section>
      {toast && <div className="service-toast" role="status">{toast}</div>}
    </div></ServiceShell>
  }

  const isLeader = team.leaderId === user.id

  return <ServiceShell activePath="/team"><div ref={rootRef}>
    <ServiceHeading icon="⌘" title={team.name} description={`팀원 ${team.members.length}/${MAX_TEAM_SIZE}명 · ${isLeader ? '내가 팀장이에요' : '팀원으로 참여 중이에요'}`}
      action={<button className="ui-button ui-button--secondary" type="button" onClick={copyInvite}>초대 링크 복사</button>} />

    <section className="team-members ui-card" data-motion-reveal>
      <header><h2>팀원</h2><span>{team.members.length}/{MAX_TEAM_SIZE}명</span></header>
      <div className="team-member-rows">{team.members.map((member) => <div className="team-member-row" key={member.id}>
        <div><b>{member.nickname}</b>{member.isLeader && <em className="team-badge team-badge--leader">팀장</em>}{member.isEditing && <em className="team-badge team-badge--editing">● {member.nickname}님이 편집 중</em>}</div>
        {isLeader && !member.isLeader && <button className="mini-button mini-button--danger" type="button" onClick={() => setRemoveTarget(member)}>내보내기</button>}
      </div>)}</div>
    </section>

    <section className="team-drafts ui-card" data-motion-reveal>
      <header><h2>팀 초안</h2></header>
      <div className="managed-list">{team.drafts.map((draft) => <article className="managed-row" key={draft.id}>
        <div className="managed-row__title"><div><h2>{draft.title}</h2><small>마지막 수정 {draft.updatedBy} · {relativeTime(draft.updatedAt)}</small></div></div>
        <div className="managed-actions"><Link className="ui-button ui-button--secondary" to="/formmate">이어서 작성</Link></div>
      </article>)}{!team.drafts.length && <p className="team-empty-row">진행 중인 초안이 없어요.</p>}</div>
    </section>

    <section className="team-surveys ui-card" data-motion-reveal>
      <header><h2>팀 설문</h2></header>
      <div className="managed-list">{team.surveys.map((survey) => {
        const progress = Math.min(100, Math.round((survey.response_count / Math.max(1, survey.target_count)) * 100))
        return <article className="managed-row" key={survey.id}>
          <div className="managed-row__title"><div><h2>{survey.title}</h2><small>마감 {survey.deadline} · 마지막 수정 {survey.updatedBy} · {relativeTime(survey.updatedAt)}</small></div></div>
          <div className="managed-progress"><span>{survey.response_count.toLocaleString()} / {survey.target_count.toLocaleString()}명 <b>{progress}%</b></span><div><i style={{ '--progress': `${progress}%` }} /></div></div>
          <div className="managed-actions"><Link className="managed-primary" to={`/surveys/${survey.id}/results`}>결과 보기</Link></div>
        </article>
      })}{!team.surveys.length && <p className="team-empty-row">아직 게시한 팀 설문이 없어요.</p>}</div>
    </section>

    {isLeader && <button className="team-disband" type="button" onClick={() => setDisbandOpen(true)}>팀 해체하기</button>}

    <Modal open={Boolean(removeTarget)} title="팀원을 내보낼까요?" onClose={() => setRemoveTarget(null)}>
      <p>‘{removeTarget?.nickname}’님을 팀에서 제외합니다. 이 작업은 되돌릴 수 없습니다.</p>
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setRemoveTarget(null)}>취소</button><button className="ui-button ui-button--danger" onClick={confirmRemove}>내보내기</button></div>
    </Modal>
    <Modal open={disbandOpen} title="팀을 해체할까요?" onClose={() => setDisbandOpen(false)}>
      <p>팀과 팀 초안·설문 연결이 모두 해제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={() => setDisbandOpen(false)}>취소</button><button className="ui-button ui-button--danger" onClick={confirmDisband}>팀 해체</button></div>
    </Modal>
    {toast && <div className="service-toast" role="status">{toast}</div>}
  </div></ServiceShell>
}
