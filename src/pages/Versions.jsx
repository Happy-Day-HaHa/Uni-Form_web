import { Link } from 'react-router-dom'
import '../styles/versions.css'

const versions = [
  {
    state: 'CURRENT',
    name: '현재 랜딩페이지',
    description: '서비스 여정을 중심으로 구성한 최신 에디토리얼 디자인',
    url: '/',
    commit: 'latest',
    current: true,
  },
  {
    state: 'ARCHIVE 02',
    name: 'Journey Landing',
    description: '파스텔 무드와 기능 흐름을 결합한 직전 디자인 원본',
    url: 'https://32f4eea9.uni-form-go.pages.dev/',
    commit: 'e7cf0cc',
  },
  {
    state: 'ARCHIVE 01',
    name: 'Playful Landing',
    description: '큰 타이포그래피와 기하학 요소를 사용한 초기 디자인',
    url: 'https://677882ca.uni-form-go.pages.dev/',
    commit: '6c54f93',
  },
]

export default function Versions() {
  return (
    <main className="version-page">
      <nav className="version-nav"><Link to="/">UNI<span>•</span>FORM</Link><Link to="/">현재 사이트로 돌아가기 →</Link></nav>
      <header className="version-heading"><p>DEPLOYMENT ARCHIVE</p><h1>랜딩페이지<br /><em>버전 기록</em></h1><p>대표 주소는 항상 최신 버전을 보여주고, 고유 배포 주소는 당시 화면을 그대로 보관합니다.</p></header>
      <section className="version-list" aria-label="랜딩페이지 배포 버전">
        {versions.map((version, index) => {
          const content = <><span className="version-card__number">{String(index + 1).padStart(2, '0')}</span><div><small>{version.state}</small><h2>{version.name}</h2><p>{version.description}</p><code>{version.commit}</code></div><strong>열어보기 ↗</strong></>
          return version.current
            ? <Link className="version-card version-card--current" to={version.url} key={version.name}>{content}</Link>
            : <a className="version-card" href={version.url} target="_blank" rel="noreferrer" key={version.name}>{content}</a>
        })}
      </section>
      <footer className="version-footer"><p>Git 태그와 Cloudflare 고유 배포 주소를 함께 사용해 코드와 화면을 모두 보존합니다.</p><Link to="/">UNI-FORM 홈</Link></footer>
    </main>
  )
}
