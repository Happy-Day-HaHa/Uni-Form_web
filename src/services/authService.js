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

// 응답: { id, email, status, emailVerificationToken }
// 메일 발송이 붙기 전까지 백엔드가 인증 토큰을 응답에 그대로 내려준다.
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

// 백엔드 토큰은 stateless라 서버 호출 없이 로컬 토큰만 지운다.
export async function logout() {
  clearTokens()
  emitAuthStateChange('SIGNED_OUT')
}
