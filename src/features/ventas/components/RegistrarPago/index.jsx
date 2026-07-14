import { useState, useEffect } from 'react'
import { FiDollarSign } from 'react-icons/fi'
import Drawer from '../../../../components/common/Drawer'
import Alert from '../../../../components/ui/feedback/Alert'
import { createPago } from '../../../../services/pagosService'
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

  return errs
}

const RegistrarPago = ({ isOpen, onClose, onSuccess, venta }) => {
  const saldoRestante = venta.total - venta.abonado

  const [form, setForm] = useState({
    tipoPago: 'completo',
    monto: String(saldoRestante),
    metodo: null,
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (form.tipoPago === 'completo') {
      setForm((prev) => ({ ...prev, monto: String(saldoRestante) }))
    } else if (!form.monto || form.monto === '0') {
      setForm((prev) => ({ ...prev, monto: '' }))
    }
  }, [form.tipoPago, saldoRestante])

  const setField = (name, value) => {
    if (name === 'monto') {
      value = value.replace(/\D/g, '')
      if (value) {
        const num = Number(value)
        if (num > saldoRestante) {
          value = String(saldoRestante)
        }
      }
    }
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

  const handleSubmit = async () => {
    const newErrors = validate(form, saldoRestante)
    setErrors(newErrors)
    setTouched({ tipoPago: true, monto: true, metodo: true })
    if (Object.keys(newErrors).length > 0) return
    setGuardando(true)
    try {
      await createPago({
        ventaId: venta.id,
        monto: Number(form.monto),
        metodo: form.metodo,
      })
      setGuardando(false)
      setShowSuccess(true)
    } catch {
      setGuardando(false)
      setShowError(true)
    }
  }

  const fmt = (val) =>
    Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  const nuevoAbonado = Number(form.monto) + venta.abonado
  const completaPago = form.tipoPago === 'completo' || nuevoAbonado >= venta.total
  const hasError = (field) => touched[field] && errors[field]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago"
      subtitle={`Venta ${venta.id} - ${venta.cliente}`}
      icon={<FiDollarSign />}
      footer={
        <>
          <button className="rpv-btn rpv-btn--outline" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="rpv-btn rpv-btn--primary" disabled={guardando} onClick={handleSubmit}>
            {guardando ? <><i className="ti ti-loader ti-spin" /> Procesando…</> : <><i className="ti ti-device-floppy" /> Confirmar Pago</>}
          </button>
        </>
      }
    >
      {/* Resumen del pedido */}
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

      {/* Formulario */}
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
            <input type="text" inputMode="numeric" className="rpv-input"
              placeholder="0" value={form.monto}
              onChange={(e) => setField('monto', e.target.value)}
              onBlur={() => handleBlur('monto')}
              disabled={form.tipoPago === 'completo'} />
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

        {errors.general && (
          <p className="rpv-err" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{errors.general}</p>
        )}
      </div>

      {showSuccess && (
        <Alert
          type="success"
          title="Pago registrado"
          message={`El pago de ${fmt(Number(form.monto))} se registró correctamente.`}
          onClose={() => { setShowSuccess(false); if (onSuccess) onSuccess(); onClose(); }}
        />
      )}

      {showError && (
        <Alert
          type="error"
          title="Error al registrar"
          message="No se pudo registrar el pago. Verifica la conexión e intenta de nuevo."
          onClose={() => setShowError(false)}
        />
      )}
    </Drawer>
  )
}

export default RegistrarPago