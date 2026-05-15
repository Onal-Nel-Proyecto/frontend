import React, { useState, useEffect, useCallback } from 'react'
import './RegisterClient.css'

const NewClientPanel = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    nombres:   '',
    apellidos: '',
    correo:    '',
    telefono:  '',
    direccion: '',
  })

  // Cerrar con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Cliente registrado:', form)
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="ncp-overlay" onClick={handleOverlayClick}>
      <div className="ncp-drawer">

        {/* ── Header ── */}
        <div className="ncp-header">
          <div className="ncp-header__left">
            <div className="ncp-header__icon">
              <i className="ti ti-user-plus" aria-hidden="true" />
            </div>
            <div>
              <h2 className="ncp-header__title">Registrar Cliente</h2>
              <p className="ncp-header__subtitle">
                Completa los datos para agregar un nuevo contacto al atelier.
              </p>
            </div>
          </div>
          <button className="ncp-close" onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x" />
          </button>
        </div>

        {/* ── Formulario ── */}
        <form className="ncp-form" onSubmit={handleSubmit}>

          {/* Nombres + Apellidos */}
          <div className="ncp-row">
            <div className="ncp-group">
              <label className="ncp-label" htmlFor="nombres">Nombres</label>
              <div className="ncp-input-wrap">
                <i className="ti ti-user" aria-hidden="true" />
                <input
                  id="nombres" name="nombres" type="text"
                  className="ncp-input"
                  placeholder="María Elena"
                  value={form.nombres} onChange={handleChange} required
                />
              </div>
            </div>
            <div className="ncp-group">
              <label className="ncp-label" htmlFor="apellidos">Apellidos</label>
              <div className="ncp-input-wrap">
                <i className="ti ti-users" aria-hidden="true" />
                <input
                  id="apellidos" name="apellidos" type="text"
                  className="ncp-input"
                  placeholder="Rossi García"
                  value={form.apellidos} onChange={handleChange} required
                />
              </div>
            </div>
          </div>

          {/* Correo */}
          <div className="ncp-row">
            <div className="ncp-group ncp-group--full">
              <label className="ncp-label" htmlFor="correo">Correo electrónico</label>
              <div className="ncp-input-wrap">
                <i className="ti ti-mail" aria-hidden="true" />
                <input
                  id="correo" name="correo" type="email"
                  className="ncp-input"
                  placeholder="ejemplo@onaandnel.com"
                  value={form.correo} onChange={handleChange} required
                />
              </div>
            </div>
          </div>

          {/* Teléfono + Dirección */}
          <div className="ncp-row">
            <div className="ncp-group">
              <label className="ncp-label" htmlFor="telefono">Teléfono</label>
              <div className="ncp-input-wrap">
                <i className="ti ti-phone" aria-hidden="true" />
                <input
                  id="telefono" name="telefono" type="tel"
                  className="ncp-input"
                  placeholder="+34 912 345 678"
                  value={form.telefono} onChange={handleChange} required
                />
              </div>
            </div>
            <div className="ncp-group ncp-group--full">
              <label className="ncp-label" htmlFor="direccion">Dirección</label>
              <div className="ncp-input-wrap">
                <i className="ti ti-map-pin" aria-hidden="true" />
                <input
                  id="direccion" name="direccion" type="text"
                  className="ncp-input"
                  placeholder="Calle, número, ciudad"
                  value={form.direccion} onChange={handleChange} required
                />
              </div>
            </div>
          </div>

        </form>

        {/* ── Footer con botones ── */}
        <div className="ncp-footer">
          <button type="button" className="ncp-btn ncp-btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="ncp-btn ncp-btn--primary" onClick={handleSubmit}>
            <i className="ti ti-user-plus" aria-hidden="true" />
            Registrar Cliente
          </button>
        </div>

      </div>
    </div>
  )
}

export default NewClientPanel
