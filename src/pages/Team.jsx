import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { isApiConfigured } from '../services/apiClient'
import { MAX_TEAMS_PER_USER, MAX_TEAM_SIZE, createTeam, disbandTeam, getMyTeams, getTeam, joinTeam, leaveTeam, regenerateInviteLink, removeMember, transferLeader } from '../services/teamService'
import '../styles/team.css'

function relativeTime(value) {
  if (!value) return '방금 전'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 2) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / 1440)}일 전`
}

// ?team=<id>로 볼 팀을 고른다. ?team=new는 "새 팀 · 가입" 탭(API 모드).
export default function Team() {
  const { user } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('team') || ''
  const [teams, setTeams] = useState([])
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [modalError, setModalError] = useState('')
  const [busy, setBusy] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [toast, setToast] = useState(location.state?.joinedTeamName ? `‘${location.state.joinedTeamName}’ 팀에 가입했어요.` : '')
  const [disbandOpen, setDisbandOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [transferTarget, setTransferTarget] = useState(null)
  const rootRef = useReveal([loading, team?.id])

  const selectTeam = useCallback((id) => setSearchParams(id ? { team: id } : {}, { replace: true }), [setSearchParams])

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const myTeams = await getMyTeams(user.id)
      setTeams(myTeams)
      const requested = selectedId && selectedId !== 'new' ? myTeams.find((item) => item.id === selectedId) : null
      // 주소의 팀에 속해 있지 않으면(내보내졌거나 해체됨) 이유를 알리고 첫 번째 내 팀을 보여준다.
      if (selectedId && selectedId !== 'new' && !requested) setActionError('주소의 팀에 속해 있지 않아요. 팀에서 내보내졌거나 해체된 팀일 수 있어요.')
      const target = selectedId === 'new' ? null : requested || myTeams[0]
      setTeam(target ? await getTeam(target.id) : null)
    } catch (error) {
      setLoadError(`팀 정보를 불러오지 못했어요. ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [selectedId, user.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 1800); return () => window.clearTimeout(timer) }, [toast])

  // 팀 목록이 바뀌는 작업(생성·가입·나가기·해체) 뒤에는 목록부터 다시 불러온다.
  async function reloadAndSelect(id) {
    if (id === selectedId) await load()
    else selectTeam(id)
  }

  function closeModals() { setRemoveTarget(null); setTransferTarget(null); setLeaveOpen(false); setDisbandOpen(false); setModalError('') }

  async function runModalAction(action) {
    try {
      setBusy(true)
      setModalError('')
      await action()
      closeModals()
    } catch (error) {
      setModalError(error.message || '요청을 처리하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    setActionError('')
    const name = nameInput.trim()
    if (name.length < 2 || name.length > 20) return setActionError('팀 이름은 2~20자로 입력해주세요.')
    try {
      setCreating(true)
      const created = await createTeam(name, user.id, user.user_metadata?.name || '나')
      setNameInput('')
      setToast(`‘${created.name}’ 팀을 만들었어요.`)
      await reloadAndSelect(created.id)
    } catch (error) {
      setActionError(`팀을 만들지 못했어요. ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(event) {
    event.preventDefault()
    setActionError('')
    if (!inviteInput.trim()) return setActionError('초대 링크나 초대 코드를 입력해주세요.')
    try {
      setJoining(true)
      const joined = await joinTeam(inviteInput)
      setInviteInput('')
      setToast(`‘${joined.name}’ 팀에 가입했어요.`)
      await reloadAndSelect(joined.id)
    } catch (error) {
      setActionError(`팀에 가입하지 못했어요. ${error.message}`)
    } finally {
      setJoining(false)
    }
  }

  async function copyInvite() {
    try { await navigator.clipboard.writeText(team.inviteLink); setToast('초대 링크를 복사했습니다.') } catch { setToast('주소를 직접 복사해주세요.') }
  }

  async function regenerateInvite() {
    setActionError('')
    try {
      await regenerateInviteLink(team.id)
      await load()
      setToast('새 초대 링크를 만들었어요. 이전 링크는 더 이상 쓸 수 없어요.')
    } catch (error) {
      setActionError(`초대 링크를 새로 만들지 못했어요. ${error.message}`)
    }
  }

  const confirmRemove = () => runModalAction(async () => {
    const next = await removeMember(team.id, removeTarget.id)
    if (next) setTeam(next)
    else await load()
    setToast(`${removeTarget.nickname}님을 팀에서 내보냈습니다.`)
  })

  const confirmTransfer = () => runModalAction(async () => {
    await transferLeader(team.id, transferTarget.id)
    await load()
    setToast(`${transferTarget.nickname}님에게 팀장을 넘겼어요.`)
  })

  const confirmLeave = () => runModalAction(async () => {
    await leaveTeam(team.id, user.id)
    setToast(`‘${team.name}’ 팀에서 나왔어요.`)
    await reloadAndSelect('')
  })

  const confirmDisband = () => runModalAction(async () => {
    await disbandTeam(team.id)
    setToast('팀을 해체했습니다.')
    await reloadAndSelect('')
  })

  if (loading) return <ServiceShell activePath="/team"><div className="team-skeleton" aria-label="팀 정보를 불러오는 중">{[0, 1, 2].map((item) => <div className="skeleton-block" key={item} />)}</div></ServiceShell>

  const banner = (loadError || actionError) && <div className="component-error" role="alert">{loadError || actionError}{loadError ? <button type="button" onClick={() => { setLoading(true); load() }}>다시 시도</button> : <button type="button" onClick={() => setActionError('')}>닫기</button>}</div>
  const canAddTeam = teams.length < MAX_TEAMS_PER_USER
  const tabs = isApiConfigured && (teams.length > 0) && <nav className="team-tabs" aria-label="내 팀">{teams.map((item) => <button type="button" key={item.id} className={team?.id === item.id ? 'active' : ''} aria-current={team?.id === item.id ? 'page' : undefined} onClick={() => selectTeam(item.id)}>{item.name}{item.isLeader && <em>팀장</em>}</button>)}<button type="button" className={!team ? 'active' : ''} onClick={() => selectTeam('new')}>＋ 새 팀 · 가입</button></nav>

  if (!team) {
    return <ServiceShell activePath="/team"><div ref={rootRef}>
      <ServiceHeading icon="⌘" title="팀 관리" description="팀장 포함 최대 6명까지, 함께 설문을 만들고 관리할 수 있어요." />
      {tabs}
      {banner}
      {canAddTeam ? <>
        <section className="team-empty ui-card" data-motion-reveal>
          <h2>{teams.length ? '새 팀 만들기' : '아직 소속된 팀이 없어요.'}</h2>
          <p>팀을 만들면 팀원을 초대해 설문을 함께 제작할 수 있습니다.</p>
          <form onSubmit={handleCreate}>
            <input className="service-input" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="팀 이름을 입력하세요. (2~20자)" maxLength={20} aria-label="팀 이름" />
            <button className="ui-button" type="submit" disabled={creating}>{creating ? '만드는 중…' : '팀 만들기'}</button>
          </form>
        </section>
        {isApiConfigured && <section className="team-empty ui-card" data-motion-reveal>
          <h2>초대받은 팀에 가입하기</h2>
          <p>팀장에게 받은 초대 링크나 초대 코드를 붙여넣어 주세요.</p>
          <form onSubmit={handleJoin}>
            <input className="service-input" value={inviteInput} onChange={(event) => setInviteInput(event.target.value)} placeholder="초대 링크 또는 초대 코드" aria-label="초대 링크 또는 초대 코드" />
            <button className="ui-button" type="submit" disabled={joining}>{joining ? '가입 중…' : '가입하기'}</button>
          </form>
        </section>}
      </> : <section className="team-empty ui-card" data-motion-reveal><h2>팀은 최대 {MAX_TEAMS_PER_USER}개까지 속할 수 있어요.</h2><p>새 팀을 만들거나 가입하려면 기존 팀에서 먼저 나와주세요.</p></section>}
      {toast && <div className="service-toast" role="status">{toast}</div>}
    </div></ServiceShell>
  }

  const isLeader = team.leaderId === user.id

  return <ServiceShell activePath="/team"><div ref={rootRef}>
    <ServiceHeading icon="⌘" title={team.name} description={`팀원 ${team.members.length}/${MAX_TEAM_SIZE}명 · ${isLeader ? '내가 팀장이에요' : '팀원으로 참여 중이에요'}`}
      action={isLeader
        ? <div className="team-heading-actions"><button className="ui-button ui-button--secondary" type="button" onClick={copyInvite} disabled={!team.inviteLink}>초대 링크 복사</button>{isApiConfigured && <button className="ui-button ui-button--secondary" type="button" onClick={regenerateInvite}>링크 새로 만들기</button>}</div>
        : <button className="ui-button ui-button--secondary" type="button" onClick={() => setLeaveOpen(true)}>팀 나가기</button>} />
    {tabs}
    {banner}
    {isLeader && isApiConfigured && team.inviteToken && <p className="team-invite-code">초대 코드 <code>{team.inviteToken}</code></p>}

    <section className="team-members ui-card" data-motion-reveal>
      <header><h2>팀원</h2><span>{team.members.length}/{MAX_TEAM_SIZE}명</span></header>
      <div className="team-member-rows">{team.members.map((member) => <div className="team-member-row" key={member.id}>
        <div><b>{member.nickname}</b>{member.isLeader && <em className="team-badge team-badge--leader">팀장</em>}{member.id === user.id && <em className="team-badge">나</em>}{member.isEditing && <em className="team-badge team-badge--editing">● {member.nickname}님이 편집 중</em>}</div>
        {isLeader && !member.isLeader && <div className="team-member-actions"><button className="mini-button" type="button" onClick={() => setTransferTarget(member)}>팀장 넘기기</button><button className="mini-button mini-button--danger" type="button" onClick={() => setRemoveTarget(member)}>내보내기</button></div>}
      </div>)}</div>
    </section>

    <section className="team-drafts ui-card" data-motion-reveal>
      <header><h2>팀 초안</h2></header>
      <div className="managed-list">{team.drafts.map((draft) => <article className="managed-row" key={draft.id}>
        <div className="managed-row__title"><div><h2>{draft.title}</h2><small><em className="team-draft-status">작성 중</em>{draft.updatedBy ? ` 마지막 수정 ${draft.updatedBy} · ${relativeTime(draft.updatedAt)}` : ` ${draft.question_count ?? 0}문항`}</small></div></div>
        <div className="managed-actions"><Link className="ui-button ui-button--secondary" to={isApiConfigured ? `/formmate?draft=${draft.id}` : '/formmate'}>이어서 작성하기 <span aria-hidden="true">→</span></Link></div>
      </article>)}{!team.drafts.length && <p className="team-empty-row">진행 중인 초안이 없어요.</p>}</div>
    </section>

    <section className="team-surveys ui-card" data-motion-reveal>
      <header><h2>팀 설문</h2></header>
      <div className="managed-list">{team.surveys.map((survey) => {
        const target = Math.max(1, Number(survey.target_count || 1))
        const responses = Number(survey.response_count || 0)
        const progress = Math.min(100, Math.round((responses / target) * 100))
        return <article className="managed-row" key={survey.id}>
          <div className="managed-row__title"><div><h2>{survey.title}</h2><small>마감 {survey.deadline || '-'}{survey.updatedBy ? ` · 마지막 수정 ${survey.updatedBy} · ${relativeTime(survey.updatedAt)}` : ''}</small></div></div>
          <div className="managed-progress"><span>{responses.toLocaleString()} / {Number(survey.target_count || 0).toLocaleString()}명 <b>{progress}%</b></span><div><i style={{ '--progress': `${progress}%` }} /></div></div>
          <div className="managed-actions">{isApiConfigured && survey.can_manage && <Link className="ui-button ui-button--secondary" to={`/my-surveys/${survey.id}/manage`}>관리하기</Link>}<Link className="managed-primary" to={`/surveys/${survey.id}/results`}>결과 보기</Link></div>
        </article>
      })}{!team.surveys.length && <p className="team-empty-row">아직 게시한 팀 설문이 없어요.</p>}</div>
    </section>

    {isLeader && <button className="team-disband" type="button" onClick={() => setDisbandOpen(true)}>팀 해체하기</button>}

    <Modal open={Boolean(removeTarget)} title="팀원을 내보낼까요?" onClose={closeModals}>
      <p>‘{removeTarget?.nickname}’님을 팀에서 제외합니다. 이 작업은 되돌릴 수 없습니다.</p>
      {modalError && <p className="form-message form-message--error" role="alert">{modalError}</p>}
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeModals}>취소</button><button className="ui-button ui-button--danger" disabled={busy} onClick={confirmRemove}>{busy ? '처리 중…' : '내보내기'}</button></div>
    </Modal>
    <Modal open={Boolean(transferTarget)} title="팀장을 넘길까요?" onClose={closeModals}>
      <p>‘{transferTarget?.nickname}’님이 새 팀장이 됩니다. 넘긴 뒤에는 팀원 내보내기·팀 설문 마감·팀 해체를 할 수 없어요.</p>
      {modalError && <p className="form-message form-message--error" role="alert">{modalError}</p>}
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeModals}>취소</button><button className="ui-button" disabled={busy} onClick={confirmTransfer}>{busy ? '처리 중…' : '팀장 넘기기'}</button></div>
    </Modal>
    <Modal open={leaveOpen} title="팀에서 나갈까요?" onClose={closeModals}>
      <p>‘{team.name}’ 팀의 초안과 설문에 더 이상 접근할 수 없어요. 다시 참여하려면 초대 링크가 필요합니다.</p>
      {modalError && <p className="form-message form-message--error" role="alert">{modalError}</p>}
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeModals}>취소</button><button className="ui-button ui-button--danger" disabled={busy} onClick={confirmLeave}>{busy ? '처리 중…' : '팀 나가기'}</button></div>
    </Modal>
    <Modal open={disbandOpen} title="팀을 해체할까요?" onClose={closeModals}>
      <p>팀과 팀 초안·설문 연결이 모두 해제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
      {modalError && <p className="form-message form-message--error" role="alert">{modalError}</p>}
      <div className="modal-actions"><button className="ui-button ui-button--secondary" onClick={closeModals}>취소</button><button className="ui-button ui-button--danger" disabled={busy} onClick={confirmDisband}>{busy ? '처리 중…' : '팀 해체'}</button></div>
    </Modal>
    {toast && <div className="service-toast" role="status">{toast}</div>}
  </div></ServiceShell>
}
