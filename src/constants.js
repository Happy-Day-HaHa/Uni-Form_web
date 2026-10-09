export const SUPPORT_EMAIL = 'ssuuniform2026@gmail.com'
// 이용약관·개인정보 처리방침의 시행일이자 문서 버전(원문의 "[배포일로 기재]"). 운영 배포 전에 이 값만 채운다.
// 형식은 'YYYY-MM-DD'(예: '2026-10-20') — 회원가입 때 약관 버전으로도 서버에 저장된다. 비어 있으면 화면에 "시행일 확정 예정"으로 보인다.
export const POLICY_EFFECTIVE_DATE = '2026-10-09'
// 회원가입 시 POST /auth/signup의 agreedTermsVersion으로 보내는 약관 버전 = 시행일.
// 시행일이 정해지기 전에는 기존 값을 보낸다(백엔드는 문자열인지만 검사한다).
export const TERMS_VERSION = POLICY_EFFECTIVE_DATE || '2026-09-01'
