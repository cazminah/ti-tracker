export function Modal({ title, children, onClose }) {
  return (
    <div className="modal__scrim" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <h2 className="modal__title">{title}</h2>
        {children}
        {onClose && (
          <button type="button" className="btn btn--ghost modal__close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
