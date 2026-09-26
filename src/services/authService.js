import { apiClient, clearTokens, emitAuthStateChange, setTokens } from './apiClient'
import { TERMS_VERSION } from '../constants'

// 회원가입 화면의 한글 선택지 → 백엔드 enum
const GENDER = { 남성: 'MALE', 여성: 'FEMALE', '응답하지 않음': 'PREFER_NOT_TO_SAY' }
const GRADE = { '1학년': 'FRESHMAN', '2학년': 'SOPHOMORE', '3학년': 'JUNIOR', '4학년 이상': 'SENIOR_OR_ABOVE', 대학원: 'GRADUATE', '해당 없음': 'NOT_APPLICABLE' }
const MAJOR_FIELD = { 인문사회: 'HUMANITIES_SOCIAL', 상경: 'BUSINESS', 공학: 'ENGINEERING', 자연과학: 'NATURAL_SCIENCE', 의약: 'MEDICINE', 예체능: 'ARTS_SPORTS', 교육: 'EDUCATION', '해당 없음': 'NOT_APPLICABLE' }
const ENROLLMENT_STATUS = { 재학: 'ENROLLED', 휴학: 'LEAVE_OF_ABSENCE', 졸업: 'GRADUATED', '해당 없음': 'NOT_APPLICABLE' }

// GET /users/me 응답. user_metadata.name은 기존 화면(Team 등) 호환용.
function toAuthUser(me) {
  return { ...me, user_metadata: { name: me.nickname } }
}

export async function getCurrentUser() {
  return toAuthUser(await apiClient.get('/users/me'))
}

export async function login({ email, password }) {
  const tokens = await apiClient.post('/auth/login', { email, password }, { auth: false })
  setTokens(tokens)
  const user = await getCurrentUser()
  emitAuthStateChange('SIGNED_IN', user)
  return { ...tokens, user }
}

// 응답: { id, email, status }. 인증 링크(/verify-email?token=...)는 가입한 이메일로 발송된다.
export async function signup({ email, password, nickname, gender, grade, major, enrollmentStatus, marketingOptIn = false }) {
  return apiClient.post('/auth/signup', {
    email,
    password,
    nickname: nickname.trim(),
    gender: GENDER[gender] ?? gender,
    grade: GRADE[grade] ?? grade,
    majorField: MAJOR_FIELD[major] ?? major,
    enrollmentStatus: ENROLLMENT_STATUS[enrollmentStatus] ?? enrollmentStatus,
    marketingOptIn,
    agreedTermsVersion: TERMS_VERSION,
  }, { auth: false })
}

export async function verifyEmail(token) {
  return apiClient.post('/auth/verify-email', { token }, { auth: false })
}

// 재설정 링크(/reset-password?token=...)를 메일로 보낸다. 가입 여부와 관계없이 항상 같은 성공 응답이 온다(계정 존재를 드러내지 않음).
export async function requestPasswordReset(email) {
  return apiClient.post('/auth/password/reset-request', { email }, { auth: false })
}

// 토큰이 없거나 만료됐거나 이미 쓰였으면 모두 400 "유효하지 않거나 만료된 재설정 토큰입니다."(code 없음).
export async function confirmPasswordReset(token, newPassword) {
  return apiClient.post('/auth/password/reset-confirm', { token, newPassword }, { auth: false })
}

// 백엔드 토큰은 stateless라 서버 호출 없이 로컬 토큰만 지운다.
export async function logout() {
  clearTokens()
  emitAuthStateChange('SIGNED_OUT')
}
