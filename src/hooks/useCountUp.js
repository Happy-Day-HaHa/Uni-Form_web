import { useEffect, useState } from 'react'

export function useCountUp(target, duration = 650) {
  const value = Number(target) || 0
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return undefined
    }
    const started = performance.now()
    let frame
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration)
      setDisplay(Math.round(value * (1 - ((1 - progress) ** 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, value])

  return display
}
