import React, { useEffect, useCallback } from 'react'
import './ViewClientModal.css'

const ViewClientModal = ({ cliente, onClose }) => {
  // Cerrar con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (cliente) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [cliente, handleKeyDown])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!cliente) return null

  // Extraer iniciales para el avatar
  const initials = cliente.name
    ?.split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??'

  return (
    <div className="vcm-overlay" onClick={handleOverlayClick}>
      <div className="vcm-card">

        {/* ── Botón cerrar ── */}
        <button className="vcm-close" onClick={onClose} aria-label="Cerrar">
          <i className="ti ti-x" />
        </button>

        {/* ── Cabecera con avatar ── */}
        <div className="vcm-head">
          <div className="vcm-avatar">
            {initials}
          </div>
          <h2 className="vcm-name">{cliente.name}</h2>
          <span className={`vcm-badge ${cliente.category === 'Activo' ? 'vcm-badge--activo' : 'vcm-badge--inactivo'}`}>
            {cliente.category}
          </span>
        </div>

        {/* ── Cuerpo: datos ── */}
        <div className="vcm-body">
          <div className="vcm-field">
            <span className="vcm-field__icon">
              <i className="ti ti-mail" />
            </span>
            <div>
              <p className="vcm-field__label">Correo electrónico</p>
              <p className="vcm-field__value">{cliente.phone || '—'}</p>
            </div>
          </div>

          <div className="vcm-field">
            <span className="vcm-field__icon">
              <i className="ti ti-map-pin" />
            </span>
            <div>
              <p className="vcm-field__label">Dirección</p>
              <p className="vcm-field__value">{cliente.address || '—'}</p>
            </div>
          </div>

          <div className="vcm-field">
            <span className="vcm-field__icon">
              <i className="ti ti-calendar" />
            </span>
            <div>
              <p className="vcm-field__label">Último pedido</p>
              <p className="vcm-field__value">
                {cliente.lastOrder
                  ? <span className="vcm-fecha">{cliente.lastOrder}</span>
                  : <span className="vcm-sin-pedido">Sin pedidos aún</span>
                }
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="vcm-footer">
          <button className="vcm-btn" onClick={onClose}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Volver
          </button>
        </div>

      </div>
    </div>
  )
}

export default ViewClientModal
