import { ApiError, apiClient } from './apiClient'
import { getMySurveys } from './surveyService'

export const MAX_TEAM_SIZE = 6
export const MAX_TEAMS_PER_USER = 3

// ── 백엔드 → 화면 모델 ─────────────────────────────────────────────────────
// 팀 상세(TeamDetailResponseDto) → 기존 화면이 쓰던 모양. inviteToken은 팀장에게만 온다.
function fromApiTeam(team) {
  return {
    id: team.id,
    name: team.name,
    leaderId: team.leaderId,
    leaderNickname: team.leaderNickname,
    memberCount: team.memberCount,
    members: team.members.map((member) => ({ id: member.userId, nickname: member.nickname || '(알 수 없음)', isLeader: member.isLeader, joinedAt: member.joinedAt })),
    inviteToken: team.inviteToken,
    inviteLink: team.inviteToken ? `${window.location.origin}/team/join/${team.inviteToken}` : null,
    drafts: [],
    surveys: [],
  }
}

// 팀 에러는 code 없이 메시지만 온다. 화면에서 이해하기 쉬운 문구로 바꿀 것만 바꾸고 나머지는 서버 문구를 쓴다.
function toTeamError(error) {
  if (!(error instanceof ApiError)) return error
  if (error.status === 400 && error.messages.some((text) => text.includes('name'))) return new ApiError({ status: 400, message: '팀 이름은 2~20자로 입력해주세요.', data: error.data })
  return error
}

async function withTeamErrors(request) {
  try {
    return await request()
  } catch (error) {
    throw toTeamError(error)
  }
}

// 초대 링크 전체 또는 토큰만 붙여넣어도 토큰을 꺼낸다.
export function parseInviteToken(value) {
  const text = String(value || '').trim()
  const match = text.match(/\/team\/join\/([^/?#\s]+)/)
  return match ? decodeURIComponent(match[1]) : text
}

// ── 공개 함수 ──────────────────────────────────────────────────────────
// 내 팀 목록: [{ id, name, leaderId, leaderNickname, memberCount, isLeader }]
export async function getMyTeams() {
  return apiClient.get('/teams/mine')
}

// 팀 상세 + 그 팀의 초안·설문(내 설문 목록 중 이 팀의 팀 설문).
export async function getTeam(teamId) {
  const [detail, mySurveys] = await Promise.all([withTeamErrors(() => apiClient.get(`/teams/${encodeURIComponent(teamId)}`)), getMySurveys()])
  const team = fromApiTeam(detail)
  // 화면 표시용 묶기: 내 설문 목록에는 팀 id가 없어 팀 이름으로 묶는다(권한 판단에는 쓰지 않는다 — 권한은 canManage).
  // 해산된 팀의 설문은 같은 이름의 새 팀 화면에 섞이지 않게 뺀다.
  const teamSurveys = mySurveys.filter((survey) => survey.owner_type === 'TEAM' && !survey.team_disbanded_at && survey.owner_name === team.name)
  team.drafts = teamSurveys.filter((survey) => survey.status === 'draft')
  team.surveys = teamSurveys.filter((survey) => survey.status !== 'draft')
  return team
}

export async function createTeam(name) {
  return fromApiTeam(await withTeamErrors(() => apiClient.post('/teams', { name: name.trim() })))
}

// 초대 토큰으로 가입. 응답: 가입한 팀 상세.
export async function joinTeam(inviteToken) {
  return fromApiTeam(await withTeamErrors(() => apiClient.post('/teams/join', { inviteToken: parseInviteToken(inviteToken) })))
}

// 팀장이 팀원을 내보낸다.
export async function removeMember(teamId, memberId) {
  await withTeamErrors(() => apiClient.delete(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}`))
  return null
}

// 팀원 본인이 나간다. 팀장은 위임한 뒤에만 나갈 수 있다(서버가 409로 거부).
export async function leaveTeam(teamId, userId) {
  await withTeamErrors(() => apiClient.delete(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`))
}

export async function transferLeader(teamId, newLeaderId) {
  return fromApiTeam(await withTeamErrors(() => apiClient.patch(`/teams/${encodeURIComponent(teamId)}/leader`, { newLeaderId })))
}

// 이전 초대 링크는 즉시 무효가 된다.
export async function regenerateInviteLink(teamId) {
  return fromApiTeam(await withTeamErrors(() => apiClient.post(`/teams/${encodeURIComponent(teamId)}/invite-token/regenerate`)))
}

export async function disbandTeam(teamId) {
  await withTeamErrors(() => apiClient.delete(`/teams/${encodeURIComponent(teamId)}`))
}

// 설문 목록의 "우리 팀" 배지용. 내 팀들의 설문(내 설문 목록 중 팀 설문)을 모은다.
export async function getMyTeam() {
  const mySurveys = await getMySurveys()
  return { surveys: mySurveys.filter((survey) => survey.owner_type === 'TEAM') }
}
