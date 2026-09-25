const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
export const isApiConfigured = Boolean(API_BASE_URL)

const ACCESS_TOKEN_KEY = 'uniform-access-token'
const REFRESH_TOKEN_KEY = 'uniform-refresh-token'

// "로그인 상태 유지"가 켜져 있으면 localStorage, 아니면 sessionStorage에 저장한다.
// 읽을 때는 양쪽을 모두 보고, 쓸 때는 한쪽에만 남긴다.
const tokenStorage = typeof window === 'undefined' ? null : {
  getItem(key) { return localStorage.getItem(key) ?? sessionStorage.getItem(key) },
  setItem(key, value) {
    const remember = localStorage.getItem('uniform-remember-login') === '1'
    const primary = remember ? localStorage : sessionStorage
    const secondary = remember ? sessionStorage : localStorage
    primary.setItem(key, value)
    secondary.removeItem(key)
  },
  removeItem(key) { localStorage.removeItem(key); sessionStorage.removeItem(key) },
}

export function getAccessToken() { return tokenStorage?.getItem(ACCESS_TOKEN_KEY) ?? null }
export function getRefreshToken() { return tokenStorage?.getItem(REFRESH_TOKEN_KEY) ?? null }
export function setTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) tokenStorage?.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) tokenStorage?.setItem(REFRESH_TOKEN_KEY, refreshToken)
}
export function clearTokens() {
  tokenStorage?.removeItem(ACCESS_TOKEN_KEY)
  tokenStorage?.removeItem(REFRESH_TOKEN_KEY)
}

// useAuth가 로그인/로그아웃(토큰 만료 포함)을 알 수 있도록 하는 구독 채널.
const authListeners = new Set()
export function onAuthStateChange(listener) {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}
export function emitAuthStateChange(event, user = null) {
  authListeners.forEach((listener) => listener(event, user))
}

// 백엔드 HttpExceptionFilter 응답: { statusCode, message: string | string[], error?, path, timestamp, ...extra }
export class ApiError extends Error {
  constructor({ status, message, messages = [message], code = null, data = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
    this.code = code
    this.data = data
  }
}

async function parseBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function toApiError(status, body) {
  const raw = body && typeof body === 'object' ? body.message : body
  const messages = (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map(String)
  if (!messages.length) messages.push(`요청을 처리하지 못했습니다. (${status})`)
  return new ApiError({ status, message: messages[0], messages, code: body?.error ?? null, data: body })
}

async function send(path, { method, body, headers, signal, auth }) {
  const finalHeaders = { Accept: 'application/json', ...headers }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'
  const token = auth ? getAccessToken() : null
  if (token) finalHeaders.Authorization = `Bearer ${token}`
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError({ status: 0, message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.', code: 'NETWORK_ERROR' })
  }
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 날린다.
let refreshPromise = null
function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(false)
  refreshPromise ??= send('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false })
    .then(async (response) => {
      if (!response.ok) return false
      const data = await parseBody(response)
      if (!data?.accessToken) return false
      setTokens({ accessToken: data.accessToken })
      return true
    })
    .catch(() => false)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

function expireSession() {
  clearTokens()
  emitAuthStateChange('SIGNED_OUT')
}

// auth: false면 토큰을 붙이지 않고 401이어도 재발급/로그아웃을 하지 않는다(로그인·회원가입 등).
export async function request(path, { method = 'GET', body, headers, signal, auth = true } = {}) {
  if (!isApiConfigured) throw new ApiError({ status: 0, message: 'VITE_API_BASE_URL 환경변수를 먼저 설정해주세요.', code: 'API_NOT_CONFIGURED' })
  const options = { method, body, headers, signal, auth }
  const sentWithToken = auth && Boolean(getAccessToken())
  let response = await send(path, options)

  if (response.status === 401 && sentWithToken) {
    if (await refreshAccessToken()) response = await send(path, options)
    if (response.status === 401) expireSession()
  }

  const data = await parseBody(response)
  if (!response.ok) throw toApiError(response.status, data)
  return data
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
