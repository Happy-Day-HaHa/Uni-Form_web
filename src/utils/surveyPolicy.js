const KST_OFFSET = 9 * 60 * 60 * 1000

export function getKstDateString(date = new Date()) {
  return new Date(date.getTime() + KST_OFFSET).toISOString().slice(0, 10)
}

export function getTomorrowKstDateString() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return getKstDateString(tomorrow)
}

export function getSurveyLifecycleStatus(survey) {
  if (survey?.status === 'draft' || survey?.status === 'archived') return survey.status
  if (survey?.status === 'closed') return 'closed'
  if (survey?.status === 'active' && survey.deadline && survey.deadline >= getKstDateString()) return 'active'
  return 'closed'
}

export function isSurveyOpen(survey) {
  return getSurveyLifecycleStatus(survey) === 'active'
}

export function isTargetReached(survey) {
  return Number(survey?.response_count || 0) >= Number(survey?.target_count || 1)
}

export function canDeleteSurvey(survey) {
  return survey?.status === 'draft' && Number(survey?.response_count || 0) === 0
}

export function getDeadlineLabel(deadline) {
  if (!deadline) return ''
  const today = Date.parse(`${getKstDateString()}T00:00:00Z`)
  const end = Date.parse(`${deadline}T00:00:00Z`)
  const days = Math.round((end - today) / 86400000)
  if (days < 0) return '마감'
  if (days === 0) return 'D-day'
  return `D-${days}`
}
