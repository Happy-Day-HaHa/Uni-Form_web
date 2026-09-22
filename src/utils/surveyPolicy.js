const KST_OFFSET = 9 * 60 * 60 * 1000

function dateUtcMillis(value) {
  const [year, month, day] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function getKstDateString(date = new Date()) {
  return new Date(date.getTime() + KST_OFFSET).toISOString().slice(0, 10)
}

export function getKstEndOfDay(deadline) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline || '')) return null
  const [year, month, day] = deadline.split('-').map(Number)
  const end = new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999))
  if (getKstDateString(end) !== deadline) return null
  return end
}

export function isValidDeadline(deadline, now = new Date()) {
  return !!getKstEndOfDay(deadline) && deadline >= getKstDateString(now)
}

export function isDeadlineExpired(deadline, now = new Date()) {
  const end = getKstEndOfDay(deadline)
  return !end || now.getTime() > end.getTime()
}

export function getSurveyLifecycleStatus(survey) {
  if (survey?.status === 'draft' || survey?.status === 'archived') return survey.status
  if (survey?.status === 'closed') return 'closed'
  if (survey?.status === 'active' && !isDeadlineExpired(survey.deadline)) return 'active'
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
  const endOfDay = getKstEndOfDay(deadline)
  if (!endOfDay) return ''
  const today = getKstDateString()
  const days = Math.round((dateUtcMillis(deadline) - dateUtcMillis(today)) / 86400000)
  if (days < 0) return '마감'
  if (days === 0) return 'D-day'
  return `D-${days}`
}
