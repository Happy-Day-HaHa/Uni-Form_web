import { apiClient } from './apiClient'
import { ENROLLMENT_STATUS, GENDER, GRADE, MAJOR_FIELD } from './authService'

const invert = (map) => Object.fromEntries(Object.entries(map).map(([label, value]) => [value, label]))
const GENDER_LABEL = invert(GENDER)
const GRADE_LABEL = invert(GRADE)
const MAJOR_LABEL = invert(MAJOR_FIELD)
const ENROLLMENT_LABEL = invert(ENROLLMENT_STATUS)

// GET /users/me → 설정 화면이 쓰는 한글 선택지 모양
export async function getProfile() {
  const me = await apiClient.get('/users/me')
  return {
    nickname: me.nickname || '',
    gender: GENDER_LABEL[me.gender] || '응답하지 않음',
    grade: GRADE_LABEL[me.grade] || '해당 없음',
    major: MAJOR_LABEL[me.majorField] || '해당 없음',
    enrollment_status: ENROLLMENT_LABEL[me.enrollmentStatus] || '해당 없음',
  }
}

// 바뀐 항목만 PATCH /users/me로 보낸다(아무것도 안 바뀌면 서버가 400 "변경할 값이 없습니다."를 준다).
export async function saveProfile(profile, original) {
  const patch = {}
  if (profile.nickname.trim() !== original.nickname) patch.nickname = profile.nickname.trim()
  if (profile.gender !== original.gender) patch.gender = GENDER[profile.gender]
  if (profile.grade !== original.grade) patch.grade = GRADE[profile.grade]
  if (profile.major !== original.major) patch.majorField = MAJOR_FIELD[profile.major]
  if (profile.enrollment_status !== original.enrollment_status) patch.enrollmentStatus = ENROLLMENT_STATUS[profile.enrollment_status]
  if (!Object.keys(patch).length) return null
  await apiClient.patch('/users/me', patch)
  return getProfile()
}

// 회원 탈퇴(DELETE /users/me). 탈퇴 후 30일 동안은 같은 이메일로 다시 가입할 수 없다.
export async function withdrawAccount() {
  await apiClient.delete('/users/me')
}

// 약관 재동의(POST /users/me/terms-consent, 본문 없음). 응답은 갱신된 회원 정보(needsTermsConsent: false).
// 비로그인 401, 탈퇴 계정 403.
export async function agreeToTerms() {
  return apiClient.post('/users/me/terms-consent')
}
