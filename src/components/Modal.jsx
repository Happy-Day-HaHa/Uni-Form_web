import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// dismissible=false: 닫기 버튼·Esc·바깥 클릭으로 닫히지 않는다(반드시 응답해야 하는 확인 창). 처음 포커스는 창 자체에 둔다.
export default function Modal({ open, title, children, onClose, className = '', dismissible = true }) {
  const closeRef = useRef(null)
  const dialogRef = useRef(null)
  const dismissibleRef = useRef(dismissible)
  dismissibleRef.current = dismissible
  // 부모가 onClose를 인라인 함수로 넘기면 렌더마다 새 함수가 된다. 효과가 그걸 의존하면
  // 모달 안 입력란에 한 글자 칠 때마다 다시 실행돼 포커스를 닫기 버튼으로 옮기고 한글 조합을 깬다.
  // 최신 onClose는 ref로 읽고, 초기 포커스·키 등록은 모달이 열릴 때 한 번만 한다.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  useEffect(() => {
    if (!open) return undefined
    // 한글 조합 중 Esc는 조합 취소용이라 모달을 닫지 않는다.
    const onKeyDown = (event) => { if (event.key === 'Escape' && !event.isComposing && dismissibleRef.current) onCloseRef.current() }
    document.addEventListener('keydown', onKeyDown)
    const timer = window.setTimeout(() => (closeRef.current ?? dialogRef.current)?.focus(), 30)
    return () => { document.removeEventListener('keydown', onKeyDown); window.clearTimeout(timer) }
  }, [open])
  if (!open) return null
  // body에 바로 렌더링한다. 페이지 안에 두면 transform이 걸린 조상(페이지 진입 애니메이션 등)이
  // position:fixed의 기준이 되어, 어두운 배경이 화면 전체가 아니라 그 영역만 덮는다.
  return createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={dismissible ? onClose : undefined}><section ref={dialogRef} tabIndex={-1} className={`modal${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>{dismissible && <button ref={closeRef} className="modal__close" type="button" aria-label="닫기" onClick={onClose}>×</button>}<h2 id="modal-title">{title}</h2>{children}</section></div>, document.body)
}
