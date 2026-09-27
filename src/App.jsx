import AppRouter from './routes/Router'
import { isApiConfigured } from './services/apiClient'

// 백엔드 주소(VITE_API_BASE_URL) 없이 빌드된 배포는 어떤 화면도 동작할 수 없다. 조용히 깨지지 않게 설정 누락을 바로 알린다.
function MissingApiConfig() {
  return <main className="page-state" role="alert"><h1>서비스 설정이 필요해요</h1><p>백엔드 주소(<code>VITE_API_BASE_URL</code>)가 설정되지 않은 채 배포되었습니다. 배포 환경변수를 설정한 뒤 다시 배포해주세요.</p></main>
}

export default function App() { return isApiConfigured ? <AppRouter /> : <MissingApiConfig /> }
