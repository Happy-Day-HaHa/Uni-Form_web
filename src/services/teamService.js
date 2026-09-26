import { ApiError, apiClient, isApiConfigured } from './apiClient'
import { getMySurveys } from './surveyService'

const STORAGE_KEY = 'uni-form-team'
export const MAX_TEAM_SIZE = 6
export const MAX_TEAMS_PER_USER = 3

// ── 데모 모드(localStorage) ────────────────────────────────────────────────
const mockTeammates = [
  { id: 'team-mem-1', nickname: '박도현', isLeader: false, isEditing: true },
  { id: 'team-mem-2', nickname: '이서진', isLeader: false, isEditing: false },
]

function mockDraft() {
  return { id: 'team-draft-1', title: '동아리 활동 만족도 조사 (초안)', updatedBy: '박도현', updatedAt: new Date(Date.now() - 3 * 3600000).toISOString() }
}
function mockSurvey() {
  return { id: 'team-survey-1', title: '학과 새내기 배움터 만족도 조사', response_count: 64, target_count: 100, deadline: '2026-09-30', updatedBy: '이서진', updatedAt: new Date(Date.now() - 26 * 3600000).toISOString() }
}

function readTeam() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
function writeTeam(team) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team))
  return team
}
const demoInviteLink = () => `${window.location.origin}/team/join/${crypto.randomUUID().slice(0, 8)}`

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

// ── 공개 함수 (두 모드 공통 시그니처) ──────────────────────────────────────
// 내 팀 목록: [{ id, name, leaderId, leaderNickname, memberCount, isLeader }]
export async function getMyTeams(userId) {
  if (!isApiConfigured) {
    const team = readTeam()
    return team ? [{ id: team.id, name: team.name, leaderId: team.leaderId, memberCount: team.members.length, isLeader: team.leaderId === userId }] : []
  }
  return apiClient.get('/teams/mine')
}

// 팀 상세 + 그 팀의 초안·설문(API 모드는 내 설문 목록 중 이 팀 이름의 팀 설문).
export async function getTeam(teamId) {
  if (!isApiConfigured) return readTeam()
  const [detail, mySurveys] = await Promise.all([withTeamErrors(() => apiClient.get(`/teams/${encodeURIComponent(teamId)}`)), getMySurveys()])
  const team = fromApiTeam(detail)
  // 화면 표시용 묶기: 내 설문 목록에는 팀 id가 없어 팀 이름으로 묶는다(권한 판단에는 쓰지 않는다 — 권한은 canManage).
  // 해산된 팀의 설문은 같은 이름의 새 팀 화면에 섞이지 않게 뺀다.
  const teamSurveys = mySurveys.filter((survey) => survey.owner_type === 'TEAM' && !survey.team_disbanded_at && survey.owner_name === team.name)
  team.drafts = teamSurveys.filter((survey) => survey.status === 'draft')
  team.surveys = teamSurveys.filter((survey) => survey.status !== 'draft')
  return team
}

export async function createTeam(name, userId, nickname = '나') {
  if (!isApiConfigured) {
    return writeTeam({
      id: crypto.randomUUID(),
      name: name.trim(),
      leaderId: userId,
      inviteLink: demoInviteLink(),
      members: [{ id: userId, nickname, isLeader: true, isEditing: false }, ...mockTeammates],
      drafts: [mockDraft()],
      surveys: [mockSurvey()],
    })
  }
  return fromApiTeam(await withTeamErrors(() => apiClient.post('/teams', { name: name.trim() })))
}

// 초대 토큰으로 가입. 응답: 가입한 팀 상세.
export async function joinTeam(inviteToken) {
  if (!isApiConfigured) throw new Error('데모 모드에서는 초대 링크로 가입할 수 없어요.')
  return fromApiTeam(await withTeamErrors(() => apiClient.post('/teams/join', { inviteToken: parseInviteToken(inviteToken) })))
}

// 팀장이 팀원을 내보낸다.
export async function removeMember(teamId, memberId) {
  if (!isApiConfigured) {
    const team = readTeam()
    if (!team) return null
    team.members = team.members.filter((member) => member.id !== memberId)
    return writeTeam(team)
  }
  await withTeamErrors(() => apiClient.delete(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}`))
  return null
}

// 팀원 본인이 나간다. 팀장은 위임한 뒤에만 나갈 수 있다(서버가 409로 거부).
export async function leaveTeam(teamId, userId) {
  if (!isApiConfigured) {
    const team = readTeam()
    if (team?.leaderId === userId) throw new Error('팀장은 팀장을 위임한 뒤에만 팀을 나갈 수 있습니다.')
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  await withTeamErrors(() => apiClient.delete(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`))
}

export async function transferLeader(teamId, newLeaderId) {
  if (!isApiConfigured) {
    const team = readTeam()
    team.leaderId = newLeaderId
    team.members = team.members.map((member) => ({ ...member, isLeader: member.id === newLeaderId }))
    return writeTeam(team)
  }
  return fromApiTeam(await withTeamErrors(() => apiClient.patch(`/teams/${encodeURIComponent(teamId)}/leader`, { newLeaderId })))
}

// 이전 초대 링크는 즉시 무효가 된다.
export async function regenerateInviteLink(teamId) {
  if (!isApiConfigured) return writeTeam({ ...readTeam(), inviteLink: demoInviteLink() })
  return fromApiTeam(await withTeamErrors(() => apiClient.post(`/teams/${encodeURIComponent(teamId)}/invite-token/regenerate`)))
}

export async function disbandTeam(teamId) {
  if (!isApiConfigured) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  await withTeamErrors(() => apiClient.delete(`/teams/${encodeURIComponent(teamId)}`))
}

// 설문 목록의 "우리 팀" 배지용. API 모드는 내 팀들의 설문(내 설문 목록 중 팀 설문)을 모은다.
export async function getMyTeam() {
  if (!isApiConfigured) return readTeam()
  const mySurveys = await getMySurveys()
  return { surveys: mySurveys.filter((survey) => survey.owner_type === 'TEAM') }
}
