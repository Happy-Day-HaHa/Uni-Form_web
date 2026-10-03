export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isStrongPassword = (password) => password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)

// Login only: intentionally returns one generic message regardless of which
// field is wrong, so a failed attempt never reveals whether the email exists.
export function validateAuth({ email, password }) {
  if (!isEmail(email) || !isStrongPassword(password)) return '이메일 또는 비밀번호를 다시 확인해주세요.'
  return ''
}

// 새 비밀번호(회원가입·비밀번호 재설정 공통 규칙)
export function validatePassword(password) {
  return isStrongPassword(password) ? '' : '비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.'
}

// Signup: field-specific messages are fine here, there is no account to leak information about yet.
export function validateSignup({ email, password, nickname }) {
  if (!isEmail(email)) return '올바른 이메일 주소를 입력해주세요.'
  if (!isStrongPassword(password)) return '비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.'
  return validateNickname(nickname)
}

export function validateNickname(nickname) {
  const trimmed = (nickname || '').trim()
  if (!trimmed) return '닉네임을 입력해주세요.'
  if (trimmed.length < 2 || trimmed.length > 12) return '닉네임은 2~12자로 입력해주세요.'
  if (!/^[가-힣a-zA-Z0-9]+$/.test(trimmed)) return '닉네임은 한글, 영문, 숫자만 사용할 수 있어요.'
  return ''
}

import { getKstDateString } from './surveyPolicy'

// 복수선택 문항의 선택 개수 범위. 입력하지 않은 값은 기본값(최소 1개, 최대 보기 수)을 쓴다.
export function getSelectRange(question) {
  const optionCount = (question.options || []).length
  const toCount = (value) => (value === null || value === undefined || value === '' ? null : Number(value))
  const min = toCount(question.minSelect)
  const max = toCount(question.maxSelect)
  return { min: min ?? 1, max: max ?? optionCount, optionCount }
}

// 예상 소요 시간(분, 선택 입력): 비어 있으면 통과, 입력했으면 1 이상의 정수여야 한다.
export function estimatedMinutesError(value) {
  if (value === '' || value === null || value === undefined) return ''
  return Number.isInteger(Number(value)) && Number(value) >= 1 ? '' : '예상 소요 시간은 1분 이상의 정수로 입력해주세요.'
}

// 선택 개수 범위가 올바르지 않으면 이유를, 올바르면 ''를 돌려준다.
export function validateSelectRange(question) {
  const { min, max, optionCount } = getSelectRange(question)
  if (!Number.isInteger(min) || !Number.isInteger(max)) return '선택 개수는 정수로 입력해주세요.'
  if (min < 1) return '최소 선택 개수는 1개 이상이어야 해요.'
  if (min > max) return '최소 선택 개수는 최대 선택 개수보다 클 수 없어요.'
  if (max > optionCount) return `최대 선택 개수는 보기 수(${optionCount}개) 이하여야 해요.`
  return ''
}

export function validateSurvey({ title, questions, targetCount, deadline, estimatedMinutes }) {
  if (title.trim().length < 3) return '설문 제목을 3자 이상 입력해주세요.'

  const filled = questions.filter((question) => question.title.trim())
  if (filled.length < 3) return '문항을 3개 이상 구성해주세요.'
  if (filled.length > 30) return '문항은 최대 30개까지 만들 수 있어요.'

  for (const question of filled) {
    const length = question.title.trim().length
    if (length < 5 || length > 200) return '모든 문항은 5~200자로 입력해주세요.'
    if (question.type === 'single' || question.type === 'multiple') {
      const options = (question.options || []).filter(Boolean)
      if (options.length < 2 || options.length > 10) return '선택형 문항의 보기는 2~10개여야 해요.'
      if (options.some((option) => option.length > 50)) return '보기는 최대 50자까지 입력할 수 있어요.'
    }
    if (question.type === 'multiple') {
      const rangeMessage = validateSelectRange(question)
      if (rangeMessage) return `${questions.indexOf(question) + 1}번 문항: ${rangeMessage}`
    }
  }

  if (targetCount < 1 || targetCount > 100) return '목표 인원은 1명 이상 100명 이하로 입력해주세요.'
  const minutesMessage = estimatedMinutesError(estimatedMinutes)
  if (minutesMessage) return minutesMessage
  if (!deadline) return '마감일을 입력해주세요.'
  if (deadline <= getKstDateString()) return '마감일은 오늘 이후 날짜로 선택해주세요.'
  return ''
}

// 게시 전 점검: validateSurvey처럼 첫 문제만이 아니라 남은 문제를 모두 돌려준다(게시 확인 창에 목록으로 보여줌).
// 서버(게시 검증)는 빈 문항도 하나의 문항으로 세고 질문 길이를 검사하므로, 빈 문항도 문제로 잡는다.
export function listSurveyIssues({ title, questions, targetCount, deadline, estimatedMinutes }) {
  const issues = []
  if (title.trim().length < 3) issues.push('설문 제목을 3자 이상 입력해주세요.')
  if (questions.length < 3) issues.push(`문항이 ${questions.length}개예요. 3개 이상 만들어주세요.`)
  if (questions.length > 30) issues.push('문항은 최대 30개까지 만들 수 있어요.')
  questions.forEach((question, index) => {
    const label = `Q${index + 1}`
    const length = question.title.trim().length
    if (!length) issues.push(`${label}: 질문이 비어 있어요.`)
    else if (length < 5 || length > 200) issues.push(`${label}: 질문은 5~200자로 입력해주세요.`)
    if (question.type === 'single' || question.type === 'multiple') {
      const options = question.options || []
      if (options.some((option) => !option.trim())) issues.push(`${label}: 비어 있는 선택지가 있어요.`)
      else if (options.length < 2 || options.length > 10) issues.push(`${label}: 선택지는 2~10개여야 해요.`)
      if (options.some((option) => option.length > 50)) issues.push(`${label}: 선택지는 50자까지 입력할 수 있어요.`)
    }
    if (question.type === 'multiple') {
      const rangeMessage = validateSelectRange(question)
      if (rangeMessage) issues.push(`${label}: ${rangeMessage}`)
    }
  })
  if (targetCount === '' || targetCount < 1 || targetCount > 100) issues.push('목표 응답 인원을 1~100명으로 입력해주세요.')
  const minutesMessage = estimatedMinutesError(estimatedMinutes)
  if (minutesMessage) issues.push(minutesMessage)
  if (!deadline) issues.push('마감일을 정해주세요.')
  else if (deadline <= getKstDateString()) issues.push('마감일은 오늘 이후 날짜로 선택해주세요.')
  return issues
}
