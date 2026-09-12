import { useEffect, useRef } from 'react'

export default function Modal({ open, title, children, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    const timer = window.setTimeout(() => closeRef.current?.focus(), 30)
    return () => { document.removeEventListener('keydown', onKeyDown); window.clearTimeout(timer) }
  }, [onClose, open])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><button ref={closeRef} className="modal__close" type="button" aria-label="닫기" onClick={onClose}>×</button><h2 id="modal-title">{title}</h2>{children}</section></div>
}
