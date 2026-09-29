// 데이터를 기다리는 동안 보여주는 공통 로딩 표시(스피너 + 안내 문구).
// page를 주면 화면 한가운데에, 아니면 놓인 영역 안에서 가운데 정렬한다.
export default function LoadingState({ children = '불러오고 있어요.', page = false }) {
  return <div className={`loading-state${page ? ' loading-state--page' : ''}`} role="status" aria-live="polite">
    <span className="loading-state__spinner" aria-hidden="true" />
    <p>{children}</p>
  </div>
}
