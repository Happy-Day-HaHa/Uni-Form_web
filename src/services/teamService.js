const STORAGE_KEY = 'uni-form-team'
export const MAX_TEAM_SIZE = 6

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

export async function getMyTeam() {
  return readTeam()
}

export async function createTeam(name, userId, nickname = '나') {
  const team = {
    id: crypto.randomUUID(),
    name: name.trim(),
    leaderId: userId,
    inviteLink: `${window.location.origin}/team/invite/${crypto.randomUUID().slice(0, 8)}`,
    members: [{ id: userId, nickname, isLeader: true, isEditing: false }, ...mockTeammates],
    drafts: [mockDraft()],
    surveys: [mockSurvey()],
  }
  return writeTeam(team)
}

export async function removeMember(memberId) {
  const team = readTeam()
  if (!team) return null
  team.members = team.members.filter((member) => member.id !== memberId)
  return writeTeam(team)
}

export async function disbandTeam() {
  localStorage.removeItem(STORAGE_KEY)
}
