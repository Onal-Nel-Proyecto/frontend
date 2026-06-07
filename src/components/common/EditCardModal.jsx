import { useEffect, useRef } from 'react'
import './EditCardModal.css'

const EditCardModal = ({ isOpen, onClose, title, subtitle, icon, children, footer, width }) => {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div className="ecm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="ecm-card" style={width ? { maxWidth: width } : undefined}>
        {/* ── Header ── */}
        <div className="ecm-header">
          <div className="ecm-header-left">
            {icon && <div className="ecm-header-icon">{icon}</div>}
            <div>
              <h2 className="ecm-title">{title}</h2>
              {subtitle && <p className="ecm-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button className="ecm-close" onClick={onClose} title="Cerrar">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ecm-body">{children}</div>

        {/* ── Footer ── */}
        {footer && <div className="ecm-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default EditCardModal
