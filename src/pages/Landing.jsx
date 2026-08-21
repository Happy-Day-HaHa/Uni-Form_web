import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <main className="uf-landing">
      <nav className="uf-nav" aria-label="주요 메뉴">
        <Link className="uf-logo" to="/" aria-label="UNI-FORM 홈">UNI<span>FORM</span></Link>
        <p>질문과 사람 사이</p>
        <div className="uf-nav__actions"><Link to="/login">로그인</Link><Link to="/signup">가입하기 <span aria-hidden="true">↗</span></Link></div>
      </nav>

      <section className="uf-hero" aria-labelledby="hero-title">
        <p className="uf-kicker"><span /> OPINIONS INTO VALUE</p>
        <h1 id="hero-title"><span>당신의 의견이</span><span><em>가치</em>가 되는 곳</span></h1>
        <p className="uf-hero__copy">답하는 사람과 묻는 사람이<br />가장 간단하게 만나는 설문 플랫폼</p>
        <div className="uf-playground" aria-hidden="true"><span className="uf-shape uf-shape--sun" /><span className="uf-shape uf-shape--arch" /><span className="uf-shape uf-shape--flower" /><span className="uf-shape uf-shape--dot" /><span className="uf-shape uf-shape--block" /></div>
        <Link className="uf-liquid-cta" to="/surveys"><span className="uf-liquid-cta__texture" aria-hidden="true" /><span>시작하기</span><b aria-hidden="true">→</b></Link>
        <p className="uf-scroll-note">SCROLL TO EXPLORE <span>↓</span></p>
      </section>

      <section className="uf-paths" aria-labelledby="paths-title">
        <header><p>CHOOSE YOUR WAY</p><h2 id="paths-title">한 가지 플랫폼,<br />두 가지 시작.</h2></header>
        <div className="uf-path-grid">
          <Link className="uf-path uf-path--answer" to="/surveys"><span className="uf-path__number">01</span><div><p>FOR PARTICIPANTS</p><h3>의견을 나누고<br />포인트를 받아요.</h3></div><span className="uf-path__arrow" aria-hidden="true">↗</span><div className="uf-path__symbol" aria-hidden="true"><i /><i /><i /></div></Link>
          <Link className="uf-path uf-path--ask" to="/surveys/create"><span className="uf-path__number">02</span><div><p>FOR CREATORS</p><h3>질문을 만들고<br />필요한 답을 모아요.</h3></div><span className="uf-path__arrow" aria-hidden="true">↗</span><div className="uf-path__symbol" aria-hidden="true"><i /><i /></div></Link>
        </div>
      </section>

      <section className="uf-flow" aria-labelledby="flow-title">
        <p>ONE SIMPLE FLOW</p><h2 id="flow-title"><span>PROFILE</span><i>→</i><span>MATCH</span><i>→</i><span>VALUE</span></h2>
        <ol><li><b>01</b> 조건을 알려주세요.</li><li><b>02</b> 맞는 설문을 만나요.</li><li><b>03</b> 응답은 가치가 됩니다.</li></ol>
      </section>

      <footer className="uf-footer"><Link className="uf-logo uf-logo--light" to="/">UNI<span>FORM</span></Link><p>질문과 사람 사이를 더 가치 있게.</p><div><Link to="/login">로그인</Link><Link to="/signup">회원가입</Link><Link to="/dashboard">대시보드</Link></div><small>© 2026 UNI-FORM</small></footer>
    </main>
  )
}
