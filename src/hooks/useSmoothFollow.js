import { useEffect } from 'react'

// 스크롤을 부드럽게 따라오는 패널. sticky처럼 딱 붙어 움직이지 않고, 목표 위치로 매 프레임 조금씩 다가간다.
// columnRef: 패널이 움직일 수 있는 범위(세로로 늘어나는 칸), panelRef: 실제로 움직일 패널.
// getTopOffset: 화면 위에서 패널이 멈춰 설 거리(px). disabled면 transform을 지우고 멈춘다.
export function useSmoothFollow(columnRef, panelRef, { getTopOffset, disabled = false, ease = 0.14 }) {
  useEffect(() => {
    const column = columnRef.current
    const panel = panelRef.current
    if (!column || !panel) return undefined
    if (disabled) { panel.style.transform = ''; return undefined }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let current = 0
    let frame = 0

    function targetY() {
      const columnTop = column.getBoundingClientRect().top + window.scrollY
      const room = column.offsetHeight - panel.offsetHeight
      return Math.max(0, Math.min(room, window.scrollY + getTopOffset() - columnTop))
    }

    function step() {
      const target = targetY()
      const diff = target - current
      current = reduceMotion || Math.abs(diff) < 0.5 ? target : current + diff * ease
      panel.style.transform = `translate3d(0, ${current.toFixed(2)}px, 0)`
      frame = current === target ? 0 : window.requestAnimationFrame(step)
    }

    function schedule() { if (!frame) frame = window.requestAnimationFrame(step) }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(column)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
      window.cancelAnimationFrame(frame)
      panel.style.transform = ''
    }
  }, [columnRef, panelRef, getTopOffset, disabled, ease])
}
