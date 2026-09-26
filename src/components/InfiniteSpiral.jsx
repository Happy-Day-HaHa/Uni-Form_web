import { useEffect, useRef, useState } from 'react'
import './InfiniteSpiral.css'

function wrap(value, length) {
  return ((value + length / 2) % length + length) % length - length / 2
}

function getResponsiveGeometry(width, geometry) {
  if (width <= 640) {
    return { ...geometry, radius: 190, cardWidth: 290, cardHeight: 146, verticalSpacing: 86, perspective: 900 }
  }
  if (width <= 1024) {
    return { ...geometry, radius: 260, cardWidth: 350, cardHeight: 150, verticalSpacing: 100, perspective: 1100 }
  }
  return geometry
}

export default function InfiniteSpiral({
  items,
  renderItem,
  animationMode = 'auto',
  speed = 0.28,
  radius = 340,
  cardWidth = 410,
  cardHeight = 156,
  verticalSpacing = 118,
  perspective = 1350,
  centerScale = 1.06,
  edgeBlur = 5,
  cardsPerTurn = 7,
  pauseOnHover = true,
  direction = 'up',
  rotation = -3,
  edgeFade = 0.45,
}) {
  const containerRef = useRef(null)
  const [phase, setPhase] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1400)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (animationMode !== 'auto' || paused || reducedMotion) return undefined
    let frame
    let previous = performance.now()
    const tick = (now) => {
      const delta = Math.min(now - previous, 40)
      previous = now
      const directionValue = direction === 'down' ? -1 : 1
      setPhase((value) => value + directionValue * speed * delta / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animationMode, direction, paused, reducedMotion, speed])

  const geometry = getResponsiveGeometry(containerWidth, {
    radius,
    cardWidth,
    cardHeight,
    verticalSpacing,
    perspective,
  })

  return <div
    className={`infinite-spiral ${reducedMotion ? 'is-reduced-motion' : ''}`}
    ref={containerRef}
    role="list"
    aria-label="대학생들이 설문 응답자를 모집하며 겪는 어려움"
    style={{ '--spiral-perspective': `${geometry.perspective}px` }}
    onMouseEnter={() => pauseOnHover && setPaused(true)}
    onMouseLeave={() => pauseOnHover && setPaused(false)}
    onFocusCapture={() => pauseOnHover && setPaused(true)}
    onBlurCapture={(event) => {
      if (pauseOnHover && !event.currentTarget.contains(event.relatedTarget)) setPaused(false)
    }}
  >
    <div className="infinite-spiral__stage">
      {items.map((item, index) => {
        const relative = wrap(index - phase, items.length)
        const angle = relative * (Math.PI * 2 / cardsPerTurn)
        const depth = (Math.cos(angle) + 1) / 2
        const verticalProgress = Math.min(1, Math.abs(relative) / (items.length / 2))
        const visibility = Math.max(0, 1 - verticalProgress * 1.35)
        const opacity = Math.max(0.08, (edgeFade + (1 - edgeFade) * depth) * visibility)
        const scale = 0.82 + (centerScale - 0.82) * depth
        const blur = edgeBlur * (1 - depth) + Math.max(0, verticalProgress - 0.5) * 3
        const x = Math.sin(angle) * geometry.radius
        const y = relative * geometry.verticalSpacing
        const z = (depth - 1) * 420
        const rotateY = Math.sin(angle) * -11
        const rotateZ = Math.sin(angle) * rotation

        return <div
          className="infinite-spiral__item"
          key={item.id ?? index}
          role="listitem"
          style={{
            width: `${geometry.cardWidth}px`,
            height: `${geometry.cardHeight}px`,
            opacity,
            filter: `blur(${blur}px)`,
            zIndex: Math.round(depth * 100),
            transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
            pointerEvents: depth > 0.68 && visibility > 0.45 ? 'auto' : 'none',
          }}
        >{renderItem(item)}</div>
      })}
    </div>
  </div>
}
