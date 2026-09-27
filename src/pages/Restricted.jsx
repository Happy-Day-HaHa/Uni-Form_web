import { Link } from 'react-router-dom'
import ServiceShell from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'

export default function Restricted() {
  const { profile } = useAuth()
  const restriction = profile?.restriction
  return <ServiceShell><section className="result-state"><span>!</span><h1>현재 이용이 제한되어 있어요</h1><p>사유: {restriction?.category || '운영 정책 위반'}<br />기간: {restriction?.until ? `${new Date(restriction.until).toLocaleString('ko-KR')}까지` : '무기한'}<br />문의: support@uni-form.kr</p><div><Link className="ui-button" to="/settings">마이페이지</Link><Link className="ui-button ui-button--secondary" to="/support">고객센터</Link></div></section></ServiceShell>
}
