import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Alert from '../../../components/ui/feedback/Alert'
import './RegisterClient.css'

const NewClientPanel = ({ isOpen, onClose, onGuardar, clienteEdit }) => {
  const [form, setForm] = useState({
    nombres:   clienteEdit?.name?.split(' ')[0] ?? '',
    apellidos: clienteEdit?.name?.split(' ').slice(1).join(' ') ?? '',
    correo:    clienteEdit?.phone ?? '',
    telefono:  clienteEdit?.telefono ?? '',
    direccion: clienteEdit?.address ?? '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [alert, setAlert] = useState(null)
  const [errorForm, setErrorForm] = useState(null)

  const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const TELEFONO_RE = /^[+\d\s-]{7,20}$/

  const validate = (form) => {
    const errs = {}
    
    const nom = form.nombres.trim()
    if (!nom) errs.nombres = 'El nombre es obligatorio'
    else if (nom.length < 2) errs.nombres = 'Mínimo 2 caracteres'
    else if (nom.length > 60) errs.nombres = 'Máximo 60 caracteres'
    else if (!SOLO_LETRAS.test(nom)) errs.nombres = 'Solo letras, sin números'

    // Apellidos opcional
    const ape = form.apellidos.trim()
    if (ape && ape.length < 2) errs.apellidos = 'Mínimo 2 caracteres'
    else if (ape && ape.length > 60) errs.apellidos = 'Máximo 60 caracteres'
    else if (ape && !SOLO_LETRAS.test(ape)) errs.apellidos = 'Solo letras, sin números'

    // Correo opcional
    const email = form.correo.trim()
    if (email && email.length > 60) errs.correo = 'Máximo 60 caracteres'
    else if (email && !EMAIL_RE.test(email)) errs.correo = 'Correo electrónico inválido'

    // Teléfono opcional
    const tel = form.telefono.trim()
    if (tel && tel.length > 20) errs.telefono = 'Máximo 20 caracteres'
    else if (tel && !TELEFONO_RE.test(tel)) errs.telefono = 'Solo números, +, - y espacios'

    // Dirección opcional
    const dir = form.direccion.trim()
    if (dir && dir.length < 5) errs.direccion = 'Mínimo 5 caracteres'
    else if (dir && dir.length > 60) errs.direccion = 'Máximo 60 caracteres'

    return errs
  }

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
    
    const newErrors = validate(form)
    setErrors(newErrors)
    setTouched({ nombres: true, apellidos: true, correo: true, telefono: true, direccion: true })
    if (Object.keys(newErrors).length > 0) return

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
      setAlert({ type: 'success', title: clienteEdit ? 'Cliente actualizado' : 'Cliente registrado', message: `Los datos de ${form.nombres.trim()} se guardaron correctamente.`, onClose: () => { setAlert(null); onClose() } })
    } else {
      setErrorForm(result.error || 'Error al guardar el cliente')
    }
    setGuardando(false)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  const handleCloseAlert = () => setAlert(null)

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
              <div className={`ncp-input-wrap ${errors.nombres && touched.nombres ? 'ncp-input-wrap--err' : ''}`}>
                <i className="ti ti-user" aria-hidden="true" />
                <input
                  id="nombres" name="nombres" type="text" maxLength="60"
                  className="ncp-input"
                  placeholder="María Elena"
                  value={form.nombres} onChange={handleChange} required
                />
              <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft:'auto'}}>Obligatorio</span>
              </div>
              {errors.nombres && touched.nombres && <p className="ncp-field-err">{errors.nombres}</p>}
            </div>
            <div className="ncp-group">
              <label className="ncp-label" htmlFor="apellidos">Apellidos</label>
              <div className={`ncp-input-wrap ${errors.apellidos && touched.apellidos ? 'ncp-input-wrap--err' : ''}`}>
                <i className="ti ti-users" aria-hidden="true" />
                <input
                  id="apellidos" name="apellidos" type="text" maxLength="60"
                  className="ncp-input"
                  placeholder="Rossi García"
                  value={form.apellidos} onChange={handleChange}
                />
              <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft:'auto'}}>Opcional</span>
              </div>
              {errors.apellidos && touched.apellidos && <p className="ncp-field-err">{errors.apellidos}</p>}
            </div>
          </div>

          {/* Correo */}
          <div className="ncp-row">
            <div className="ncp-group ncp-group--full">
              <label className="ncp-label" htmlFor="correo">Correo electrónico</label>
              <div className={`ncp-input-wrap ${errors.correo && touched.correo ? 'ncp-input-wrap--err' : ''}`}>
                <i className="ti ti-mail" aria-hidden="true" />
                <input
                  id="correo" name="correo" type="email" maxLength="60"
                  className="ncp-input"
                  placeholder="ejemplo@onaandnel.com"
                  value={form.correo} onChange={handleChange}
                />
              <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft:'auto'}}>Opcional</span>
              </div>
              {errors.correo && touched.correo && <p className="ncp-field-err">{errors.correo}</p>}
            </div>
          </div>

          {/* Teléfono + Dirección */}
          <div className="ncp-row">
            <div className="ncp-group">
              <label className="ncp-label" htmlFor="telefono">Teléfono</label>
              <div className={`ncp-input-wrap ${errors.telefono && touched.telefono ? 'ncp-input-wrap--err' : ''}`}>
                <i className="ti ti-phone" aria-hidden="true" />
                <input
                  id="telefono" name="telefono" type="tel" maxLength="20"
                  className="ncp-input"
                  placeholder="+57 300 123 4567"
                  value={form.telefono} onChange={handleChange}
                />
              <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft:'auto'}}>Opcional</span>
              </div>
              {errors.telefono && touched.telefono && <p className="ncp-field-err">{errors.telefono}</p>}
            </div>
            <div className="ncp-group ncp-group--full">
              <label className="ncp-label" htmlFor="direccion">Dirección</label>
              <div className={`ncp-input-wrap ${errors.direccion && touched.direccion ? 'ncp-input-wrap--err' : ''}`}>
                <i className="ti ti-map-pin" aria-hidden="true" />
                <input
                  id="direccion" name="direccion" type="text" maxLength="60"
                  className="ncp-input"
                  placeholder="Calle, número, ciudad"
                  value={form.direccion} onChange={handleChange}
                />
              <span style={{fontSize:'0.65rem', color:'var(--text-muted)', marginLeft:'auto'}}>Opcional</span>
              </div>
              {errors.direccion && touched.direccion && <p className="ncp-field-err">{errors.direccion}</p>}
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

      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose || handleCloseAlert} />}
    </div>,
    document.body
  )
}

export default NewClientPanel
