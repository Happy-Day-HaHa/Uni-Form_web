import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { useAuth } from '../hooks/useAuth'
import { logout, setLoginNotice } from '../services/authService'
import { agreeToTerms } from '../services/userService'

// 약관이 바뀌어 재동의가 필요한 회원(GET /users/me의 needsTermsConsent)에게 닫을 수 없는 동의 창을 띄운다.
// 로그인 직후와 앱을 열 때 모두 같은 회원 정보로 판단한다. 약관 문서(새 탭)는 읽을 수 있게 이 창을 띄우지 않는다.
const DOCUMENT_PATHS = ['/terms', '/privacy']

export default function TermsConsentGate() {
  const { user, setCurrentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const open = Boolean(user?.needsTermsConsent) && !DOCUMENT_PATHS.includes(location.pathname)

  // 로그아웃하고 로그인 화면으로 보낸다. 안내 문구는 setLoginNotice로 넘긴다(로그아웃 직후 PrivateRoute의 이동이 state를 덮어쓸 수 있음).
  async function leave(notice, state = undefined) {
    setLoginNotice(notice)
    setError('')
    await logout()
    navigate('/login', { replace: true, state })
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
      <button className="ui-button ui-button--secondary" type="button" disabled={submitting} onClick={() => leave('동의하지 않으면 회원 탈퇴할 수 있어요. 설정에서 탈퇴할 수 있어요.')}>동의하지 않아요</button>
      <button className="ui-button" type="button" disabled={submitting} onClick={agree}>{submitting ? '처리 중…' : '동의하고 계속하기'}</button>
    </div>
  </Modal>
}
