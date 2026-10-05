// 로그인 후 돌아갈 주소 검증. 같은 사이트 내부 경로만 허용하고, 그 밖의 값은 fallback으로 보낸다.
// 허용: "/"로 시작하는 상대 경로. 거부: "//evil.com", "/\evil.com"(브라우저가 //로 해석), "https://...", "javascript:...",
// 제어 문자(탭·줄바꿈은 URL 해석 때 지워져 "/\t/evil.com"이 "//evil.com"이 된다), 로그인 화면 자신(무한 반복 방지).
export const DEFAULT_AFTER_LOGIN = '/dashboard'

export function safeRedirectPath(value, fallback = DEFAULT_AFTER_LOGIN) {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback
  let url
  try { url = new URL(value, window.location.origin) } catch { return fallback }
  if (url.origin !== window.location.origin) return fallback
  if (url.pathname === '/login') return fallback
  return `${url.pathname}${url.search}${url.hash}`
}

// 라우터 state의 from(PrivateRoute가 넘기는 location 객체, 또는 문자열)을 경로 문자열로 만든다.
export function redirectFromState(from) {
  if (typeof from === 'string') return from
  if (from && typeof from === 'object' && typeof from.pathname === 'string') return `${from.pathname}${from.search || ''}${from.hash || ''}`
  return null
}
