import { apiClient } from './apiClient'

// POST /support/inquiries — 로그인 없이도 접수할 수 있다.
// 로그인했으면 서버가 계정 이메일로 답변 주소를 정하고, 비로그인이면 email이 필수다.
// 응답: { id, status, createdAt }
export async function submitInquiry({ subject, message, email }) {
  return apiClient.post('/support/inquiries', { subject, message, ...(email ? { email } : {}) })
}
