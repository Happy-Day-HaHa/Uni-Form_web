import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import './SurveyCoverflow.css'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function SurveyCoverflow({
  surveys,
  userId,
  rotate = 38,
  depth = 0.55,
  perspective = 2.6,
  falloff = 0.6,
  fade = 0.16,
  cardWidth = 'clamp(230px, 27vw, 300px)',
  cardRatio = 1.32,
  gap = 0.1,
}) {
  const navigate = useNavigate()
  const count = surveys.length

  const frameRef = useRef(null)
  const cardRefs = useRef([])
  const posRef = useRef(0)
  const targetRef = useRef(0)
  const widthRef = useRef(0)
  const rafRef = useRef(null)
  const dragRef = useRef(null)
  const lastDragDistanceRef = useRef(0)
  const selectedRef = useRef(0)
  const knownSurveyIdsRef = useRef(new Set())

  const [selected, setSelected] = useState(0)
  const [enteringIds, setEnteringIds] = useState(new Set())
  const setSelectedIndex = useCallback((index) => { selectedRef.current = index; setSelected(index) }, [])

  const indexAt = useCallback((pos) => ((Math.round(pos) % count) + count) % count, [count])

  const paint = useCallback(() => {
    const width = widthRef.current
    if (!width) return
    const pitch = width * (1 + gap)
    const pos = posRef.current

    cardRefs.current.forEach((card, index) => {
      if (!card) return
      let offset = index - pos
      offset = ((offset % count) + count) % count
      if (offset > count / 2) offset -= count

      const distance = Math.abs(offset)
      const ramp = Math.pow(distance, falloff)
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset)
      const scale = Math.max(0.72, 1 - ramp * 0.16)

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg) scale(${scale})`

      const edge = Math.min(1, Math.max(0, count / 2 - distance))
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge)
      card.style.zIndex = String(100 - Math.round(distance))
      card.classList.toggle('is-active', index === selectedRef.current)
    })
  }, [count, depth, fade, falloff, gap, rotate])

  const settle = useCallback((target) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    targetRef.current = target
    setSelectedIndex(indexAt(target))

    const step = () => {
      const remaining = target - posRef.current
      if (Math.abs(remaining) < 0.0004) {
        posRef.current = target
        paint()
        rafRef.current = null
        return
      }
      posRef.current += remaining * 0.18
      paint()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [indexAt, paint, setSelectedIndex])

  const goTo = useCallback((index) => {
    const target = index + Math.round((targetRef.current - index) / count) * count
    settle(target)
  }, [count, settle])

  const nudge = useCallback((by) => settle(Math.round(targetRef.current) + by), [settle])

  const onPointerDown = (event) => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    event.currentTarget.setPointerCapture(event.pointerId)
    targetRef.current = posRef.current
    lastDragDistanceRef.current = 0
    dragRef.current = { id: event.pointerId, x: event.clientX, pos: posRef.current, v: 0, t: performance.now(), moved: 0 }
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    const pitch = widthRef.current * (1 + gap)
    if (!pitch) return

    const now = performance.now()
    const previous = posRef.current
    posRef.current = drag.pos - (event.clientX - drag.x) / pitch
    drag.moved = Math.max(drag.moved, Math.abs(event.clientX - drag.x))
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000
    drag.t = now

    const index = indexAt(posRef.current)
    if (index !== selectedRef.current) setSelectedIndex(index)
    paint()
  }

  const endDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    lastDragDistanceRef.current = drag.moved
    dragRef.current = null
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18))
    settle(Math.round(posRef.current + carried))
  }

  useIsoLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => {
      const card = cardRefs.current[0]
      if (!card) return
      widthRef.current = card.offsetWidth
      paint()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [paint])

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }, [])

  useEffect(() => {
    const currentIds = new Set(surveys.map((survey) => survey.id))
    const addedIds = new Set(surveys.filter((survey) => !knownSurveyIdsRef.current.has(survey.id)).map((survey) => survey.id))
    knownSurveyIdsRef.current = currentIds
    if (!addedIds.size) return undefined

    setEnteringIds(addedIds)
    const timeout = window.setTimeout(() => setEnteringIds(new Set()), 850)
    return () => window.clearTimeout(timeout)
  }, [surveys])

  const cardStyle = useMemo(() => ({ '--sc-card': cardWidth, '--sc-ratio': cardRatio }), [cardWidth, cardRatio])

  const handleCardClick = (event, survey, index, wasDrag) => {
    if (wasDrag) return
    if (index !== selected) { goTo(index); return }
    const isOwner = survey.creator_id === userId
    const canViewResults = isOwner && survey.response_count > 0
    if (isOwner) { if (canViewResults) navigate(`/surveys/${survey.id}/results`) }
    else navigate(`/surveys/${survey.id}`)
  }

  if (!count) return null

  return (
    <div className="survey-coverflow" style={cardStyle}>
      <div className="survey-coverflow__frame-wrap">
        <div
          ref={frameRef}
          className="survey-coverflow__frame"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="설문 목록"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-1) }
            else if (event.key === 'ArrowRight') { event.preventDefault(); nudge(1) }
          }}
          style={{ perspective: `calc(var(--sc-card) * ${perspective})` }}
        >
          <div className="survey-coverflow__stage">
            {surveys.map((survey, index) => {
              const isOwner = survey.creator_id === userId
              const canViewResults = isOwner && survey.response_count > 0
              return (
                <div
                  key={survey.id}
                  ref={(node) => { cardRefs.current[index] = node }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${count}`}
                  className={`survey-coverflow__card ${isOwner ? 'is-owned' : ''} ${enteringIds.has(survey.id) ? 'is-entering' : ''}`.trim()}
                  onClick={(event) => handleCardClick(event, survey, index, lastDragDistanceRef.current > 6)}
                >
                  <div className="survey-coverflow__top"><span className="tag">{isOwner ? '내 설문' : survey.category || '일반'}</span><strong>{survey.response_count || 0}명 응답</strong></div>
                  <h3>{survey.title}</h3>
                  <p>{survey.description}</p>
                  <ProgressBar value={survey.response_count || 0} max={survey.target_count} />
                  <footer>
                    <span>{isOwner ? `목표 ${survey.target_count}명` : `약 ${survey.estimated_minutes || 5}분`}</span>
                    <b>{isOwner ? (canViewResults ? '결과 보기 →' : '응답 대기 중') : '참여하기 →'}</b>
                  </footer>
                </div>
              )
            })}
          </div>
        </div>

        <button type="button" className="survey-coverflow__nav survey-coverflow__nav--prev" aria-label="이전 설문" onClick={() => nudge(-1)}>‹</button>
        <button type="button" className="survey-coverflow__nav survey-coverflow__nav--next" aria-label="다음 설문" onClick={() => nudge(1)}>›</button>
      </div>

      <div className="survey-coverflow__dots">
        {surveys.map((survey, index) => (
          <button key={survey.id} type="button" aria-label={`${index + 1}번째 설문으로 이동`} aria-current={index === selected} className={index === selected ? 'is-active' : ''} onClick={() => goTo(index)} />
        ))}
      </div>
    </div>
  )
}
