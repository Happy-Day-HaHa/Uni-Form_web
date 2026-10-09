import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { useAuth } from '../hooks/useAuth'
import { logout, setPageNotice } from '../services/authService'
import { agreeToTerms } from '../services/userService'

// 약관이 바뀌어 재동의가 필요한 회원(GET /users/me의 needsTermsConsent)에게 닫을 수 없는 동의 창을 띄운다.
// 로그인 직후와 앱을 열 때 모두 같은 회원 정보로 판단한다. 약관 문서(새 탭)는 읽을 수 있게 이 창을 띄우지 않는다.
// 동의하지 않으면 설정의 탈퇴 탭(/settings?tab=data)으로 보내고, 그 탭에서만 창 대신 안내를 보여준다(Settings).
const DOCUMENT_PATHS = ['/terms', '/privacy']
export const WITHDRAW_PATH = '/settings?tab=data'
const OPEN_EVENT = 'uniform:open-terms-consent'

export function isWithdrawTab(location) {
  return location.pathname === '/settings' && new URLSearchParams(location.search).get('tab') === 'data'
}

// 탈퇴 탭의 "약관 다시 보고 동의하기"가 부른다.
export function openTermsConsent() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export default function TermsConsentGate() {
  const { user, setCurrentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // 탈퇴 탭에서 다시 열어 달라고 한 경우, 그 화면(location.key)에 있는 동안만 창을 띄운다. 다른 화면으로 가면 원래 규칙대로.
  const [reopenedAt, setReopenedAt] = useState(null)
  const locationKeyRef = useRef(location.key)
  locationKeyRef.current = location.key
  useEffect(() => {
    const reopen = () => setReopenedAt(locationKeyRef.current)
    window.addEventListener(OPEN_EVENT, reopen)
    return () => window.removeEventListener(OPEN_EVENT, reopen)
  }, [])
  const reopenedHere = reopenedAt !== null && reopenedAt === location.key
  const exempt = DOCUMENT_PATHS.includes(location.pathname) || (isWithdrawTab(location) && !reopenedHere)
  const open = Boolean(user?.needsTermsConsent) && !exempt

  // 로그아웃하고 로그인 화면으로 보낸다. 안내 문구는 setPageNotice로 넘긴다(로그아웃 직후 PrivateRoute의 이동이 state를 덮어쓸 수 있음).
  async function leave(notice, state = undefined) {
    setPageNotice('login', notice)
    setError('')
    await logout()
    navigate('/login', { replace: true, state })
  }

  // 동의하지 않으면 로그아웃하지 않고 탈퇴 탭으로 보낸다(그 탭에서는 창이 닫히고 안내가 보인다).
  function decline() {
    setError('')
    setReopenedAt(null)
    navigate(WITHDRAW_PATH)
  }

  async function agree() {
    setSubmitting(true)
    setError('')
    try {
      // 성공하면 갱신된 회원 정보(needsTermsConsent: false)로 바꿔 창을 닫고, 보던 화면은 그대로 둔다.
      setCurrentUser(await agreeToTerms())
    } catch (reason) {
      if (reason.status === 401) await leave('로그인이 만료됐어요. 다시 로그인한 뒤 약관에 동의해주세요.', { from: location })
      else if (reason.status === 403) await leave('탈퇴한 계정이라 약관에 동의할 수 없어요.')
      else setError(reason.message || '동의를 처리하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return <Modal open={open} dismissible={false} className="terms-consent" title="약관이 바뀌었어요">
    <p>UniForm 이용약관과 개인정보 처리방침이 <span className="terms-consent__date">{user?.currentTermsVersion}</span>부터 시행돼요.</p>
    <div className="terms-consent__links"><a href="/terms" target="_blank" rel="noopener noreferrer">이용약관 보기 (새 탭)</a><a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보 처리방침 보기 (새 탭)</a></div>
    {error && <p className="form-message form-message--error" role="alert">{error}</p>}
    <div className="modal-actions terms-consent__actions">
      <button className="ui-button ui-button--secondary" type="button" disabled={submitting} onClick={decline}>동의하지 않아요</button>
      <button className="ui-button" type="button" disabled={submitting} onClick={agree}>{submitting ? '처리 중…' : '동의하고 계속하기'}</button>
    </div>
  </Modal>
}
