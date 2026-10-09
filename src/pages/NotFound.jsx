import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../hooks/useAuth'
import '../styles/support.css'
import '../styles/legal.css'

// 없는 주소로 들어왔을 때. 홈으로 몰래 보내지 않고, 주소가 잘못됐다는 걸 알려준다.
export default function NotFound() {
  const { user } = useAuth()
  return <main className="support-standalone legal-page motion-page">
    <header className="support-standalone__header"><Link to="/" aria-label="UniForm 홈"><BrandMark /></Link></header>
    <section className="not-found" aria-labelledby="not-found-title">
      <b>404</b>
      <h1 id="not-found-title">페이지를 찾을 수 없어요</h1>
      <p>주소가 바뀌었거나 삭제된 페이지예요. 입력한 주소를 다시 확인해주세요.</p>
      <div><Link className="ui-button" to="/">홈으로 가기</Link>{user ? <Link className="ui-button ui-button--secondary" to="/surveys">설문 목록 보기</Link> : <Link className="ui-button ui-button--secondary" to="/support">고객센터</Link>}</div>
    </section>
  </main>
}
