import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ServiceShell, { ServiceHeading } from '../components/ServiceShell'
import { joinTeam } from '../services/teamService'
import '../styles/team.css'

// 초대 링크(/team/join/:token)로 들어온 화면. 백엔드에 토큰으로 팀 정보를 미리 보는 API가 없어 가입 후에 팀 이름을 보여준다.
export default function TeamJoin() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function join() {
    try {
      setJoining(true)
      setError('')
      const team = await joinTeam(token)
      navigate(`/team?team=${team.id}`, { replace: true, state: { joinedTeamName: team.name } })
    } catch (reason) {
      setError(reason.message || '팀에 가입하지 못했어요.')
    } finally {
      setJoining(false)
    }
  }

  return <ServiceShell activePath="/team">
    <ServiceHeading icon="⌘" title="팀 초대" description="초대 링크로 팀에 가입할 수 있어요. 한 사람은 최대 3개 팀까지 속할 수 있습니다." />
    <section className="team-empty ui-card">
      <h2>초대받은 팀에 가입할까요?</h2>
      <p>가입하면 팀 초안과 팀 설문을 함께 만들고 결과를 볼 수 있어요.</p>
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      <div className="modal-actions"><Link className="ui-button ui-button--secondary" to="/team">내 팀으로 가기</Link><button className="ui-button" type="button" disabled={joining} onClick={join}>{joining ? '가입 중…' : '팀 가입하기'}</button></div>
    </section>
  </ServiceShell>
}
