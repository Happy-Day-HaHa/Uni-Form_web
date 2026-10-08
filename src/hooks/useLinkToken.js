import { useEffect, useState } from 'react'

const CONSUMED_MARK = 'uniformLinkTokenConsumed'

// 메일 링크(?token=...)의 토큰을 읽은 직후 주소에서 token만 지운다(다른 쿼리와 해시는 그대로).
// 주소창·방문 기록·Referer로 토큰이 새지 않게 하기 위함이다. 읽은 토큰은 state에 들고 있어 새로고침 전까지는 그대로 동작한다.
// 지울 때 지금 방문 기록(history.state)에 표시를 남겨 둔다 — 새로고침하면 표시는 남고 토큰은 없으므로 expired로 알려준다.
// 토큰 없이 처음 들어온 경우(가입 직후 안내, "비밀번호 찾기")는 표시가 없어 expired가 아니다.
export function useLinkToken() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [expired] = useState(() => !token && Boolean(window.history.state?.[CONSUMED_MARK]))

  useEffect(() => {
    if (!token) return
    const url = new URL(window.location.href)
    if (!url.searchParams.has('token')) return
    url.searchParams.delete('token')
    window.history.replaceState({ ...window.history.state, [CONSUMED_MARK]: true }, '', `${url.pathname}${url.search}${url.hash}`)
  }, [token])

  return { token, expired }
}
