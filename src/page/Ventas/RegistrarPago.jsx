import { useState, useEffect, useCallback } from 'react'
import './RegistrarPago.css'

const METODOS = [
  { id: 'efectivo', icono: 'ti ti-cash', label: 'Efectivo', color: '#2e7d32', bg: '#e8f5e9' },
  { id: 'transferencia', icono: 'ti ti-building-bank', label: 'Transferencia', color: '#7c3aed', bg: '#ede9fe' },
  { id: 'tarjeta', icono: 'ti ti-credit-card', label: 'Tarjeta', color: '#2563eb', bg: '#dbeafe' },
]

const validate = (form, saldoRestante) => {
  const errs = {}
  if (!form.tipoPago) errs.tipoPago = 'Selecciona el tipo de pago'

  const monto = parseFloat(form.monto)
  if (!form.monto || isNaN(monto)) errs.monto = 'Ingresa un monto válido'
  else if (monto <= 0) errs.monto = 'El monto debe ser mayor a $0'
  else if (monto > saldoRestante) errs.monto = `El monto no puede superar ${Number(saldoRestante).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`

  if (!form.metodo) errs.metodo = 'Selecciona un método de pago'

  if (!form.fecha) errs.fecha = 'Selecciona la fecha del pago'

  return errs
}

const RegistrarPago = ({ isOpen, onClose, venta }) => {
  const saldoRestante = venta.total - venta.abonado

  const [form, setForm] = useState({
    tipoPago: 'completo',
    monto: '',
    metodo: null,
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (form.tipoPago === 'completo') {
      setForm((prev) => ({ ...prev, monto: String(saldoRestante) }))
    } else {
      setForm((prev) => ({ ...prev, monto: '' }))
    }
  }, [form.tipoPago, saldoRestante])

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

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      const newForm = { ...form, [name]: value }
      const newErrors = validate(newForm, saldoRestante)
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] || undefined }))
    }
  }

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validate(form, saldoRestante)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] || undefined }))
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = () => {
    const newErrors = validate(form, saldoRestante)
    setErrors(newErrors)
    setTouched({ tipoPago: true, monto: true, metodo: true, fecha: true })
    if (Object.keys(newErrors).length > 0) return
    setGuardando(true)
    setTimeout(() => {
      console.log('Pago registrado:', {
        pedido: venta.pedido_id,
        tipo: form.tipoPago,
        monto: Number(form.monto),
        metodo: form.metodo,
        fecha: form.fecha,
        notas: form.notas,
        completado: form.tipoPago === 'completo' || (Number(form.monto) + venta.abonado >= venta.total),
      })
      setGuardando(false)
      onClose()
    }, 1000)
  }

  const fmt = (val) =>
    Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  const nuevoAbonado = Number(form.monto) + venta.abonado
  const completaPago = form.tipoPago === 'completo' || nuevoAbonado >= venta.total
  const hasError = (field) => touched[field] && errors[field]

  if (!isOpen) return null

  return (
    <div className="rpv-overlay" onClick={handleOverlayClick}>
      <div className="rpv-drawer">
        <div className="rpv-header">
          <div className="rpv-header__left">
            <div className="rpv-header__icon"><i className="ti ti-coin" /></div>
            <div>
              <h2 className="rpv-header__title">Registrar Pago</h2>
              <p className="rpv-header__subtitle">Pedido {venta.pedido_id} — {venta.cliente}</p>
            </div>
          </div>
          <button className="rpv-close" onClick={onClose} aria-label="Cerrar"><i className="ti ti-x" /></button>
        </div>

        <div className="rpv-resumen">
          <div className="rpv-resumen-row">
            <span className="rpv-resumen-label">Cliente</span>
            <span className="rpv-resumen-value">{venta.cliente}</span>
          </div>
          <div className="rpv-resumen-row">
            <span className="rpv-resumen-label">Descripción</span>
            <span className="rpv-resumen-value rpv-resumen-desc">{venta.descripcion}</span>
          </div>
          <div className="rpv-resumen-divider" />
          <div className="rpv-resumen-row">
            <span className="rpv-resumen-label">Total del pedido</span>
            <span className="rpv-resumen-value rpv-resumen-total">{fmt(venta.total)}</span>
          </div>
          <div className="rpv-resumen-row">
            <span className="rpv-resumen-label">Ya abonado</span>
            <span className="rpv-resumen-value rpv-resumen-abonado">{fmt(venta.abonado)}</span>
          </div>
          <div className="rpv-resumen-row rpv-resumen-row--dest">
            <span className="rpv-resumen-label">Saldo restante</span>
            <span className="rpv-resumen-value rpv-resumen-saldo">{fmt(saldoRestante)}</span>
          </div>
        </div>

        <div className="rpv-form">
          {/* Tipo de pago */}
          <div className="rpv-field">
            <label className="rpv-label">Tipo de pago</label>
            <div className="rpv-toggle">
              <button type="button"
                className={`rpv-toggle-btn ${form.tipoPago === 'abono' ? 'rpv-toggle-btn--active' : ''}`}
                onClick={() => setField('tipoPago', 'abono')}>
                <i className="ti ti-receipt-2" /> Abono
              </button>
              <button type="button"
                className={`rpv-toggle-btn ${form.tipoPago === 'completo' ? 'rpv-toggle-btn--active' : ''}`}
                onClick={() => setField('tipoPago', 'completo')}>
                <i className="ti ti-circle-check" /> Pago completo
              </button>
            </div>
            {hasError('tipoPago') && <p className="rpv-err">{errors.tipoPago}</p>}
          </div>

          {/* Monto */}
          <div className="rpv-field">
            <label className="rpv-label">{form.tipoPago === 'abono' ? 'Monto a abonar' : 'Monto a cobrar'}</label>
            <div className={`rpv-input-wrap ${hasError('monto') ? 'rpv-input-wrap--err' : ''}`}>
              <span className="rpv-input-sign">$</span>
              <input type="number" step="1" min="0.01" max={saldoRestante} className="rpv-input"
                placeholder="0" value={form.monto}
                onChange={(e) => setField('monto', e.target.value)}
                onBlur={() => handleBlur('monto')} />
            </div>
            {hasError('monto') && <p className="rpv-err">{errors.monto}</p>}
            {form.tipoPago === 'abono' && form.monto && !errors.monto && (
              <p className="rpv-hint">
                {completaPago
                  ? '✅ Con este abono se completa el pago total'
                  : `ℹ️ Quedarán ${fmt(saldoRestante - Number(form.monto))} pendientes`
                }
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div className="rpv-field">
            <label className="rpv-label">Método de pago</label>
            <div className="rpv-metodos">
              {METODOS.map((m) => (
                <button type="button" key={m.id}
                  className={`rpv-metodo-btn ${form.metodo === m.id ? 'rpv-metodo-btn--sel' : ''} ${hasError('metodo') ? 'rpv-metodo-btn--err' : ''}`}
                  style={{ '--met-color': m.color, '--met-bg': m.bg }}
                  onClick={() => { setField('metodo', m.id); setTouched((p) => ({ ...p, metodo: true })) }}>
                  <span className="rpv-metodo-icon" style={{ background: m.bg, color: m.color }}><i className={m.icono} /></span>
                  <span className="rpv-metodo-label">{m.label}</span>
                  {form.metodo === m.id && <span className="rpv-metodo-check"><i className="ti ti-circle-check-filled" /></span>}
                </button>
              ))}
            </div>
            {hasError('metodo') && <p className="rpv-err">{errors.metodo}</p>}
          </div>

          {/* Fecha */}
          <div className="rpv-field">
            <label className="rpv-label" htmlFor="rpv-fecha">Fecha del pago</label>
            <div className={`rpv-input-wrap ${hasError('fecha') ? 'rpv-input-wrap--err' : ''}`}>
              <i className="ti ti-calendar" />
              <input id="rpv-fecha" type="date" className="rpv-input"
                value={form.fecha}
                onChange={(e) => setField('fecha', e.target.value)}
                onBlur={() => handleBlur('fecha')} />
            </div>
            {hasError('fecha') && <p className="rpv-err">{errors.fecha}</p>}
          </div>

          {/* Notas */}
          <div className="rpv-field">
            <label className="rpv-label" htmlFor="rpv-notas">Notas (opcional)</label>
            <div className="rpv-input-wrap">
              <i className="ti ti-notes" />
              <input id="rpv-notas" type="text" className="rpv-input"
                placeholder="Observaciones del pago..." value={form.notas}
                onChange={(e) => setField('notas', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rpv-footer">
          <div className="rpv-footer__actions">
            <button className="rpv-btn rpv-btn--outline" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button className="rpv-btn rpv-btn--primary"
              disabled={guardando} onClick={handleSubmit}>
              {guardando ? <><i className="ti ti-loader ti-spin" /> Procesando…</> : <><i className="ti ti-device-floppy" /> Confirmar Pago</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrarPago
