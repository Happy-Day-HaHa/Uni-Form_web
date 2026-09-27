import { Link } from 'react-router-dom'

export default function AdminForbidden() {
  return <main className="admin-gate"><section><span>403</span><h1>접근 권한이 없어요</h1><p>관리자 권한이 있는 계정만 이 화면을 사용할 수 있습니다.</p><Link className="ui-button" to="/dashboard">서비스로 돌아가기</Link></section></main>
}
