import { Component } from 'react'
import BrandMark from './BrandMark'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('UNI-FORM 화면을 표시하는 중 오류가 발생했습니다.', error)
  }

  render() {
    if (this.state.hasError) {
      return <main className="error-fallback" role="alert">
        <BrandMark />
        <p className="eyebrow">TEMPORARY DISPLAY ERROR</p>
        <h1>화면을 불러오지 못했어요.</h1>
        <p>잠시 후 다시 시도하거나 홈 화면을 새로 불러와 주세요.</p>
        <a className="button" href="/">홈으로 다시 불러오기</a>
      </main>
    }

    return this.props.children
  }
}
