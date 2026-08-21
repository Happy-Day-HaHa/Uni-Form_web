export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export function validateAuth({ email, password }) {
  if (!isEmail(email)) return '올바른 이메일 주소를 입력해주세요.'
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
  return ''
}
export function validateSurvey({ title, questions, targetCount, rewardPoints }) {
  if (title.trim().length < 3) return '설문 제목을 3자 이상 입력해주세요.'
  if (!questions.some((question) => question.title.trim())) return '질문을 하나 이상 입력해주세요.'
  if (targetCount < 1 || rewardPoints < 1) return '목표 인원과 포인트는 1 이상이어야 합니다.'
  return ''
}
