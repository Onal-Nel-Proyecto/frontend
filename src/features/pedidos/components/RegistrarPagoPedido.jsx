import { useState, useEffect } from 'react'
import { FiDollarSign } from 'react-icons/fi'
import Drawer from '../../../../components/common/Drawer'
import './RegistrarPagoPedido.css'

const METODOS = [
  { id: 'efectivo', icono: 'ti ti-cash', label: 'Efectivo', color: '#2e7d32', bg: '#e8f5e9' },
  { id: 'transferencia', icono: 'ti ti-building-bank', label: 'Transferencia', color: '#7c3aed', bg: '#ede9fe' },
  { id: 'tarjeta', icono: 'ti ti-credit-card', label: 'Tarjeta', color: '#2563eb', bg: '#dbeafe' },
  { id: 'nequi', icono: 'ti ti-device-mobile', label: 'Nequi', color: '#d946ef', bg: '#fce7f3' },
  { id: 'daviplata', icono: 'ti ti-device-mobile-vibration', label: 'Daviplata', color: '#059669', bg: '#d1fae5' },
  { id: 'otro', icono: 'ti ti-circle-dashed', label: 'Otro', color: '#6b7280', bg: '#f3f4f6' },
]

const validate = (form, saldoRestante) => {
  const errs = {}
  if (!form.tipoPago) errs.tipoPago = 'Selecciona el tipo de pago'

  const monto = parseFloat(form.monto)
  if (!form.monto || isNaN(monto)) errs.monto = 'Ingresa un monto válido'
  else if (monto <= 0) errs.monto = 'El monto debe ser mayor a $0'

  if (!form.metodo) errs.metodo = 'Selecciona un método de pago'

  if (form.metodo === 'otro' && !form.metodo_otro.trim()) errs.metodo_otro = 'Especifica el método de pago'

  return errs
}

const RegistrarPagoPedido = ({ isOpen, onClose, pedido }) => {
  const saldoRestante = (pedido?.total || 0) - (pedido?.abonado || 0)

  const [form, setForm] = useState({
    tipoPago: 'completo',
    monto: '',
    metodo: null,
    metodo_otro: '',

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

  const setField = (name, value) => {
    // Auto-clamp monto al saldo restante
    if (name === 'monto' && value) {
      const num = Number(value)
      if (num > saldoRestante) {
        value = String(saldoRestante)
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

  const handleSubmit = () => {
    const newErrors = validate(form, saldoRestante)
    setErrors(newErrors)
    setTouched({ tipoPago: true, monto: true, metodo: true, metodo_otro: true })
    if (Object.keys(newErrors).length > 0) return
    setGuardando(true)
    setTimeout(() => {
      console.log('Pago de pedido registrado:', {
        pedido: pedido.pedido_id,
        tipo: form.tipoPago,
        monto: Number(form.monto),
        metodo: form.metodo,
        metodo_otro: form.metodo_otro,
      })
      setGuardando(false)
      onClose()
    }, 1000)
  }

  const fmt = (val) =>
    Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  const nuevoAbonado = Number(form.monto) + (pedido?.abonado || 0)
  const completaPago = form.tipoPago === 'completo' || nuevoAbonado >= (pedido?.total || 0)
  const hasError = (field) => touched[field] && errors[field]

  const limpiar = () => {
    setForm({
      tipoPago: 'completo',
      monto: '',
      metodo: null,
      metodo_otro: '',
    })
    setErrors({})
    setTouched({})
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago — Pedido"
      subtitle={`${pedido?.pedido_id} — ${pedido?.cliente}`}
      icon={<FiDollarSign />}
      footer={
        <>
          <button className="rpp-btn rpp-btn--outline" onClick={limpiar} disabled={guardando}>Limpiar</button>
          <button className="rpp-btn rpp-btn--primary" disabled={guardando} onClick={handleSubmit}>
            {guardando ? <><i className="ti ti-loader ti-spin" /> Procesando…</> : <><i className="ti ti-device-floppy" /> Registrar Pago</>}
          </button>
        </>
      }
    >
      <div className="rpp-resumen">
        <div className="rpp-resumen-row">
          <span className="rpp-resumen-label">Cliente</span>
          <span className="rpp-resumen-value">{pedido?.cliente}</span>
        </div>
        <div className="rpp-resumen-row">
          <span className="rpp-resumen-label">Descripción</span>
          <span className="rpp-resumen-value rpp-resumen-desc">{pedido?.descripcion}</span>
        </div>
        <div className="rpp-resumen-divider" />
        <div className="rpp-resumen-row">
          <span className="rpp-resumen-label">Total del pedido</span>
          <span className="rpp-resumen-value rpp-resumen-total">{fmt(pedido?.total || 0)}</span>
        </div>
        <div className="rpp-resumen-row">
          <span className="rpp-resumen-label">Abonado</span>
          <span className="rpp-resumen-value rpp-resumen-abonado">{fmt(pedido?.abonado || 0)}</span>
        </div>
        <div className="rpp-resumen-row rpp-resumen-row--dest">
          <span className="rpp-resumen-label">Saldo restante</span>
          <span className="rpp-resumen-value rpp-resumen-saldo">{fmt(saldoRestante)}</span>
        </div>
      </div>

      <div className="rpp-form">
        <div className="rpp-field">
          <label className="rpp-label">Tipo de pago</label>
          <div className="rpp-toggle">
            <button type="button"
              className={`rpp-toggle-btn ${form.tipoPago === 'abono' ? 'rpp-toggle-btn--active' : ''}`}
              onClick={() => setField('tipoPago', 'abono')}>
              <i className="ti ti-receipt-2" /> Abono
            </button>
            <button type="button"
              className={`rpp-toggle-btn ${form.tipoPago === 'completo' ? 'rpp-toggle-btn--active' : ''}`}
              onClick={() => setField('tipoPago', 'completo')}>
              <i className="ti ti-circle-check" /> Pago completo
            </button>
          </div>
          {hasError('tipoPago') && <p className="rpp-err">{errors.tipoPago}</p>}
        </div>

        <div className="rpp-field">
          <label className="rpp-label">{form.tipoPago === 'abono' ? 'Monto a abonar' : 'Monto a cobrar'}</label>
          <div className={`rpp-input-wrap ${hasError('monto') ? 'rpp-input-wrap--err' : ''}`}>
            <span className="rpp-input-sign">$</span>
            <input type="number" step="1" min="0.01" max={saldoRestante} className="rpp-input"
              placeholder="0" value={form.monto}
              onChange={(e) => setField('monto', e.target.value)}
              onBlur={() => handleBlur('monto')} />
          </div>
          {hasError('monto') && <p className="rpp-err">{errors.monto}</p>}
          {form.tipoPago === 'abono' && form.monto && !errors.monto && (
            <p className="rpp-hint">
              {completaPago
                ? '✅ Con este abono se completa el pago total'
                : `ℹ️ Quedarán ${fmt(saldoRestante - Number(form.monto))} pendientes`
              }
            </p>
          )}
        </div>

        <div className="rpp-field">
          <label className="rpp-label">Método de pago</label>
          <div className="rpp-metodos">
            {METODOS.map((m) => (
              <button type="button" key={m.id}
                className={`rpp-metodo-btn ${form.metodo === m.id ? 'rpp-metodo-btn--sel' : ''} ${hasError('metodo') ? 'rpp-metodo-btn--err' : ''}`}
                style={{ '--met-color': m.color, '--met-bg': m.bg }}
                onClick={() => { setField('metodo', m.id); setTouched((p) => ({ ...p, metodo: true })) }}>
                <span className="rpp-metodo-icon" style={{ background: m.bg, color: m.color }}><i className={m.icono} /></span>
                <span className="rpp-metodo-label">{m.label}</span>
                {form.metodo === m.id && <span className="rpp-metodo-check"><i className="ti ti-circle-check-filled" /></span>}
              </button>
            ))}
          </div>
          {hasError('metodo') && <p className="rpp-err">{errors.metodo}</p>}
        </div>

        {form.metodo === 'otro' && (
          <div className="rpp-field">
            <label className="rpp-label">Especifica el método</label>
            <div className={`rpp-input-wrap ${hasError('metodo_otro') ? 'rpp-input-wrap--err' : ''}`}>
              <i className="ti ti-edit" />
              <input type="text" maxLength="50" className="rpp-input"
                placeholder="Ej: Mercado Pago, Cripto..." value={form.metodo_otro}
                onChange={(e) => setField('metodo_otro', e.target.value)}
                onBlur={() => handleBlur('metodo_otro')} />
            </div>
            {hasError('metodo_otro') && <p className="rpp-err">{errors.metodo_otro}</p>}
          </div>
        )}


      </div>
    </Drawer>
  )
}

export default RegistrarPagoPedido
