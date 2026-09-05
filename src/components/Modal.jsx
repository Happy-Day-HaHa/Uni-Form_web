export default function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal__close" type="button" aria-label="닫기" onClick={onClose}>×</button><h2 id="modal-title">{title}</h2>{children}</section></div>
}
