import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './RegisterClient.css'

const NewClientPanel = ({ isOpen, onClose, onGuardar, clienteEdit }) => {
  const [form, setForm] = useState({
    nombres:   clienteEdit?.name?.split(' ')[0] ?? '',
    apellidos: clienteEdit?.name?.split(' ').slice(1).join(' ') ?? '',
    correo:    clienteEdit?.phone ?? '',
    telefono:  clienteEdit?.telefono ?? '',
    direccion: clienteEdit?.address ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState(null)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!onGuardar) {
      console.log('Cliente registrado (modo demo):', form)
      onClose()
      return
    }

    setGuardando(true)
    setErrorForm(null)

    // Mapear el formulario al formato que espera la API
    const clienteData = {
      cliente_nombre: form.nombres.trim(),
      cliente_apellido: form.apellidos.trim(),
      cliente_email: form.correo.trim(),
      cliente_direccion: form.direccion.trim(),
      telefono: form.telefono
        ? [{ numero_telefono: form.telefono.trim() }]
        : [],
    }

    const result = await onGuardar(clienteData)

    if (result.ok) {
      setForm({ nombres: '', apellidos: '', correo: '', telefono: '', direccion: '' })
      onClose()
    } else {
      setErrorForm(result.error || 'Error al guardar el cliente')
    }
    setGuardando(false)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="ncp-overlay" onClick={handleOverlayClick}>
      <div className="ncp-drawer">

        {/* ── Header ── */}
        <div className="ncp-header">
          <div className="ncp-header__left">
            <div className="ncp-header__icon">
              <i className="ti ti-user-plus" aria-hidden="true" />
            </div>
            <div>
              <h2 className="ncp-header__title">{clienteEdit ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
              <p className="ncp-header__subtitle">
                {clienteEdit
                  ? 'Actualiza los datos del cliente seleccionado.'
                  : 'Completa los datos para agregar un nuevo contacto al atelier.'
                }
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
          {errorForm && (
            <p className="ncp-error">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {' '}{errorForm}
            </p>
          )}
          <div className="ncp-footer__actions">
            <button
              type="button"
              className="ncp-btn ncp-btn--outline"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="ncp-btn ncp-btn--primary"
              onClick={handleSubmit}
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <i className="ti ti-loader ti-spin" aria-hidden="true" />
                  {' '}{clienteEdit ? 'Actualizando…' : 'Guardando…'}
                </>
              ) : (
                <>
                  <i className="ti ti-user-plus" aria-hidden="true" />
                  {clienteEdit ? 'Actualizar Cliente' : 'Registrar Cliente'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}

export default NewClientPanel
