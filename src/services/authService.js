import { apiClient, clearTokens, emitAuthStateChange, setTokens } from './apiClient'
import { TERMS_VERSION } from '../constants'

// 회원가입·설정 화면의 한글 선택지 → 백엔드 enum
export const GENDER = { 남성: 'MALE', 여성: 'FEMALE', '응답하지 않음': 'PREFER_NOT_TO_SAY' }
export const GRADE = { '1학년': 'FRESHMAN', '2학년': 'SOPHOMORE', '3학년': 'JUNIOR', '4학년 이상': 'SENIOR_OR_ABOVE', 대학원: 'GRADUATE', '해당 없음': 'NOT_APPLICABLE' }
export const MAJOR_FIELD = { 인문사회: 'HUMANITIES_SOCIAL', 상경: 'BUSINESS', 공학: 'ENGINEERING', 자연과학: 'NATURAL_SCIENCE', 의약: 'MEDICINE', 예체능: 'ARTS_SPORTS', 교육: 'EDUCATION', '해당 없음': 'NOT_APPLICABLE' }
export const ENROLLMENT_STATUS = { 재학: 'ENROLLED', 휴학: 'LEAVE_OF_ABSENCE', 졸업: 'GRADUATED', '해당 없음': 'NOT_APPLICABLE' }

// GET /users/me 응답
function toAuthUser(me) {
  return me
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

// 로그아웃시키며 다음 화면에 한 번만 보여줄 안내(page: 'login' | 'home'). 로그아웃되는 순간 PrivateRoute가 먼저
// /login으로 보낼 수 있어 화면 이동 state 대신 sessionStorage로 넘기고, 받는 화면이 한 번 읽고 지운다.
const NOTICE_KEYS = { login: 'uniform-login-notice', home: 'uniform-home-notice' }
export function setPageNotice(page, text) {
  try { sessionStorage.setItem(NOTICE_KEYS[page], text) } catch { /* 안내는 없어도 동작한다 */ }
}
export function peekPageNotice(page) {
  try { return sessionStorage.getItem(NOTICE_KEYS[page]) || '' } catch { return '' }
}
export function clearPageNotice(page) {
  try { sessionStorage.removeItem(NOTICE_KEYS[page]) } catch { /* 무시 */ }
}

// 탈퇴처럼 로그인 화면을 거치지 않고 끝내야 할 때: 토큰만 지우고 목적지를 새로 연다.
// 앱에 로그아웃을 알리지 않으므로 PrivateRoute가 /login으로 보내거나 돌아갈 주소를 남기지 않고, 새로 열면서 로그인 상태도 초기화된다.
export function logoutAndReload(path = '/') {
  clearTokens()
  window.location.replace(path)
}
