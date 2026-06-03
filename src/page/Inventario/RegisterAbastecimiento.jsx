import { useState, useEffect } from 'react'
import { FiTruck, FiSave } from 'react-icons/fi'
import Drawer from '../../components/common/Drawer'
import './RegisterAbastecimiento.css'

const TIPOS_ITEM = ['MATERIAL', 'PRODUCTO']

const ITEM_VACIO = { tipo: 'MATERIAL', cantidad: '', costo: '' }

// ── Validaciones ──────────────────────────
const validate = (form, proveedores) => {
  const errs = {}

  // Proveedor
  if (!form.provIdFk) errs.provIdFk = 'Selecciona un proveedor'
  else if (!proveedores.some((p) => p.provId === form.provIdFk))
    errs.provIdFk = 'El proveedor seleccionado no es válido'

  // Detalles
  if (!form.detalles || form.detalles.length === 0) {
    errs.detalles = 'Agrega al menos un ítem al abastecimiento'
  } else {
    const itemsErrs = []
    form.detalles.forEach((item, i) => {
      const ie = {}

      const cant = item.cantidad.toString().trim()
      if (cant === '') ie.cantidad = 'Ingresa la cantidad'
      else if (!/^\d+$/.test(cant)) ie.cantidad = 'Solo números enteros'
      else {
        const n = parseInt(cant, 10)
        if (n <= 0) ie.cantidad = 'Debe ser mayor a 0'
        else if (n > 99999) ie.cantidad = 'Máximo 99999'
      }

      if (item.costo !== '' && item.costo !== null) {
        const costoStr = item.costo.toString().trim()
        if (!/^\d+(\.\d{1,2})?$/.test(costoStr)) ie.costo = 'Formato inválido (ej: 1500 o 1500.50)'
        else if (parseFloat(costoStr) < 0) ie.costo = 'No puede ser negativo'
      }

      if (Object.keys(ie).length > 0) itemsErrs.push(ie)
      else itemsErrs.push(null)
    })
    if (itemsErrs.some((e) => e !== null)) errs.detallesItems = itemsErrs
  }

  return errs
}

const RegisterAbastecimiento = ({ isOpen, onClose, proveedores = [], onSave }) => {
  const [form, setForm] = useState({
    provIdFk: '',
    detalles: [{ ...ITEM_VACIO }],
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  // Resetear formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setForm({ provIdFk: '', detalles: [{ ...ITEM_VACIO }] })
      setErrors({})
      setTouched({})
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const nuevos = [...prev.detalles]
      nuevos[index] = { ...nuevos[index], [field]: value }
      return { ...prev, detalles: nuevos }
    })
  }

  const handleAddItem = () => {
    setForm((prev) => ({ ...prev, detalles: [...prev.detalles, { ...ITEM_VACIO }] }))
  }

  const handleRemoveItem = (index) => {
    if (form.detalles.length <= 1) return
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }))
  }

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate(form, proveedores)
    setErrors(newErrors)
    setTouched({ provIdFk: true, detalles: true })

    if (Object.keys(newErrors).length > 0) return

    setSaving(true)

    // Construir payload para la API
    const payload = {
      provIdFk: form.provIdFk,
      detalles: form.detalles.map((d) => ({
        tipo: d.tipo,
        cantidad: parseInt(d.cantidad, 10),
        costo: d.costo !== '' && d.costo !== null ? parseFloat(d.costo) : null,
      })),
    }

    await onSave?.(payload)
    setSaving(false)
  }

  const hasError = (field) => touched[field] && errors[field]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Abastecimiento"
      subtitle="Registra la entrada de materiales o productos al inventario desde un proveedor."
      icon={<FiTruck />}
      footer={
        <>
          <button type="button" className="ra-btn ra-btn--outline" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="ra-form" className="ra-btn ra-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <><i className="ti ti-loader ti-spin" /> Guardando…</>
            ) : (
              <><i className="ti ti-device-floppy" /> Registrar Abastecimiento</>
            )}
          </button>
        </>
      }
    >
      <form id="ra-form" className="ra-form" onSubmit={handleSubmit} noValidate>
        {/* ── Proveedor ── */}
        <div className="ra-row">
          <div className="ra-group ra-group--full">
            <label className="ra-label" htmlFor="ra-proveedor">
              Proveedor <span className="ra-required">*</span>
            </label>
            <div className="ra-input-wrap">
              <i className="ti ti-truck ra-input-icon" />
              <select
                id="ra-proveedor"
                name="provIdFk"
                className={`ra-input ra-select ${hasError('provIdFk') ? 'ra-input--error' : ''}`}
                value={form.provIdFk}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">Seleccione un proveedor...</option>
                {proveedores.map((p) => (
                  <option key={p.provId} value={p.provId}>
                    {p.provNom}
                  </option>
                ))}
              </select>
            </div>
            {hasError('provIdFk') && <p className="ra-err">{errors.provIdFk}</p>}
          </div>
        </div>

        {/* ── Ítems del abastecimiento ── */}
        <div className="ra-section">
          <div className="ra-section-header">
            <h4 className="ra-section-title">
              <i className="ti ti-list-details" /> Ítems del Abastecimiento
            </h4>
            <button type="button" className="ra-add-item-btn" onClick={handleAddItem}>
              <i className="ti ti-plus" /> Agregar ítem
            </button>
          </div>

          {errors.detalles && <p className="ra-err ra-err--global">{errors.detalles}</p>}

          {form.detalles.map((item, index) => (
            <div key={index} className="ra-item-card">
              <div className="ra-item-header">
                <span className="ra-item-index">#{index + 1}</span>
                {form.detalles.length > 1 && (
                  <button type="button" className="ra-item-remove" onClick={() => handleRemoveItem(index)} title="Quitar ítem">
                    <i className="ti ti-trash" />
                  </button>
                )}
              </div>

              <div className="ra-item-row">
                {/* Tipo */}
                <div className="ra-group ra-group--tipo">
                  <label className="ra-label">Tipo</label>
                  <select
                    className="ra-input ra-select ra-input--no-icon"
                    value={item.tipo}
                    onChange={(e) => handleItemChange(index, 'tipo', e.target.value)}
                  >
                    {TIPOS_ITEM.map((t) => (
                      <option key={t} value={t}>{t === 'MATERIAL' ? 'Material' : 'Producto'}</option>
                    ))}
                  </select>
                </div>

                {/* Cantidad */}
                <div className="ra-group ra-group--cant">
                  <label className="ra-label">
                    Cantidad <span className="ra-required">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99999"
                    className={`ra-input ra-input--no-icon ${errors.detallesItems?.[index]?.cantidad ? 'ra-input--error' : ''}`}
                    placeholder="0"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                  />
                  {errors.detallesItems?.[index]?.cantidad && (
                    <p className="ra-err">{errors.detallesItems[index].cantidad}</p>
                  )}
                </div>

                {/* Costo */}
                <div className="ra-group ra-group--costo">
                  <label className="ra-label">Costo unitario</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`ra-input ra-input--no-icon ${errors.detallesItems?.[index]?.costo ? 'ra-input--error' : ''}`}
                    placeholder="0.00"
                    value={item.costo}
                    onChange={(e) => handleItemChange(index, 'costo', e.target.value)}
                  />
                  {errors.detallesItems?.[index]?.costo && (
                    <p className="ra-err">{errors.detallesItems[index].costo}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </form>
    </Drawer>
  )
}

export default RegisterAbastecimiento
