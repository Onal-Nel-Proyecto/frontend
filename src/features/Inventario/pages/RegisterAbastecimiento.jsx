import { useState, useEffect } from 'react'
import { FiTruck } from 'react-icons/fi'
import Drawer from '../../../components/common/Drawer'
import { getMateriales } from '../../../api/materialesService'
import { getProductos as getProductosApi } from '../../../api/productosApiService'
import './RegisterAbastecimiento.css'

const TIPOS_ITEM = ['MATERIAL', 'PRODUCTO']

const ITEM_VACIO = { tipo: 'MATERIAL', cantidad: '', costo: '', refId: '', busqueda: '', focus: false }

const validate = (form, proveedores) => {
  const errs = {}
  if (!form.provIdFk) errs.provIdFk = 'Selecciona un proveedor'
  else if (!proveedores.some((p) => p.provId === form.provIdFk))
    errs.provIdFk = 'El proveedor seleccionado no es válido'

  if (!form.detalles || form.detalles.length === 0) {
    errs.detalles = 'Agrega al menos un ítem al abastecimiento'
  } else {
    const itemsErrs = []
    form.detalles.forEach((item, i) => {
      const ie = {}
      if (!item.refId) ie.refId = 'Selecciona una referencia'
      const cant = item.cantidad.toString().trim()
      if (cant === '') ie.cantidad = 'Ingresa la cantidad'
      else if (!/^\d+$/.test(cant)) ie.cantidad = 'Solo números enteros'
      else {
        const n = parseInt(cant, 10)
        if (n <= 0) ie.cantidad = 'Debe ser mayor a 0'
        else if (n > 100) ie.cantidad = 'Máximo 100'
      }
      const costoStr = (item.costo ?? '').toString().trim()
      if (costoStr === '') ie.costo = 'Ingresa el costo unitario'
      else if (!/^\d+(\.\d{1,2})?$/.test(costoStr)) ie.costo = 'Formato inválido (ej: 1500 o 1500.50)'
      else if (parseFloat(costoStr) <= 0) ie.costo = 'Debe ser mayor a $0'
      else if (parseFloat(costoStr) > 999999999999) ie.costo = 'Máximo $999,999,999,999'
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
  const [referencias, setReferencias] = useState({ MATERIAL: [], PRODUCTO: [] })
  const [loadingRef, setLoadingRef] = useState(false)

  // Cargar referencias reales desde la API al abrir
  useEffect(() => {
    if (!isOpen) return
    const cargar = async () => {
      setLoadingRef(true)
      try {
        const [matRes, prodRes] = await Promise.all([
          getMateriales({ limite: 100 }),
          getProductosApi({ limite: 100 }),
        ])
        // Bug #3: Guardamos id y nombre por separado para el autocomplete
        const mats = Array.isArray(matRes?.data) ? matRes.data.map(m => ({ id: m.id, nombre: m.nombre })) : []
        const prods = Array.isArray(prodRes?.data) ? prodRes.data.map(p => ({ id: p.id, nombre: p.nombre })) : []
        setReferencias({ MATERIAL: mats, PRODUCTO: prods })
      } catch (err) {
        console.warn('No se pudieron cargar referencias:', err)
        setReferencias({ MATERIAL: [], PRODUCTO: [] })
      } finally {
        setLoadingRef(false)
      }
    }
    cargar()
  }, [isOpen])

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
      if (field === 'tipo') {
        nuevos[index] = { ...nuevos[index], tipo: value, refId: '', busqueda: '' }
      } else {
        nuevos[index] = { ...nuevos[index], [field]: value }
      }
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
    const payload = {
      provIdFk: form.provIdFk,
      detalles: form.detalles.map((d) => ({
        detAbsTip: d.tipo,
        detAbsRefId: d.refId,
        detAbsRefNombre: d.busqueda || `Ref #${d.refId}`,
        detAbsCant: parseInt(d.cantidad, 10),
        detAbsCos: parseFloat(d.costo) || 0,
      })),
    }
    try {
      await onSave?.(payload)
    } finally {
      setSaving(false)
    }
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
          <button type="button" className="ra-btn ra-btn--outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="ra-form" className="ra-btn ra-btn--primary" onClick={handleSubmit} disabled={saving || loadingRef}>
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
        <div className="ra-row">
          <div className="ra-group ra-group--full">
            <label className="ra-label" htmlFor="ra-proveedor">
              Proveedor <span className="ra-required">*</span>
            </label>
            <div className="ra-input-wrap">
              <i className="ti ti-truck ra-input-icon" />
              <select
                id="ra-proveedor" name="provIdFk"
                className={`ra-input ra-select ${hasError('provIdFk') ? 'ra-input--error' : ''}`}
                value={form.provIdFk} onChange={handleChange} onBlur={handleBlur}
              >
                <option value="">Seleccione un proveedor...</option>
                {proveedores.map((p) => (
                  <option key={p.provId} value={p.provId}>{p.provNom}</option>
                ))}
              </select>
            </div>
            {hasError('provIdFk') && <p className="ra-err">{errors.provIdFk}</p>}
          </div>
        </div>

        <div className="ra-section">
          <div className="ra-section-header">
            <h4 className="ra-section-title">
              <i className="ti ti-list-details" /> Ítems del Abastecimiento
            </h4>
            <button type="button" className="ra-add-item-btn" onClick={handleAddItem}>
              <i className="ti ti-plus" /> Agregar ítem
            </button>
          </div>

          {loadingRef && <p className="ra-err ra-err--global"><i className="ti ti-loader ti-spin" /> Cargando referencias...</p>}
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
                <div className="ra-group ra-group--tipo">
                  <label className="ra-label">Tipo</label>
                  <select className="ra-input ra-select ra-input--no-icon" value={item.tipo}
                    onChange={(e) => handleItemChange(index, 'tipo', e.target.value)}>
                    {TIPOS_ITEM.map((t) => (
                      <option key={t} value={t}>{t === 'MATERIAL' ? 'Material' : 'Producto'}</option>
                    ))}
                  </select>
                </div>

                <div className="ra-group ra-group--ref">
                  <label className="ra-label">Referencia <span className="ra-required">*</span></label>
                  <div className="ra-autocomplete">
                    <input
                      type="text" maxLength="50"
                      className={`ra-input ra-input--no-icon ${errors.detallesItems?.[index]?.refId ? 'ra-input--error' : ''}`}
                      placeholder={loadingRef ? 'Cargando...' : (item.refId ? '✓ Referencia seleccionada' : 'Escribe o haz clic para buscar...')}
                      value={item.busqueda}
                      onChange={(e) => handleItemChange(index, 'busqueda', e.target.value)}
                      onFocus={() => handleItemChange(index, 'focus', true)}
                      onBlur={() => setTimeout(() => handleItemChange(index, 'focus', false), 200)}
                      disabled={loadingRef}
                      autoComplete="off"
                    />
                    {item.focus && !loadingRef && (
                      <>
                        {(referencias[item.tipo] || []).filter(r =>
                          !item.busqueda || r.nombre.toLowerCase().includes(item.busqueda.toLowerCase())
                        ).length > 0 ? (
                          <ul className="ra-autocomplete-dropdown">
                            {(referencias[item.tipo] || []).filter(r =>
                              !item.busqueda || r.nombre.toLowerCase().includes(item.busqueda.toLowerCase())
                            ).slice(0, 20).map(ref => (
                              <li
                                key={ref.id}
                                className={`ra-autocomplete-item ${ref.id === item.refId ? 'ra-autocomplete-item--active' : ''}`}
                                onClick={() => {
                                  handleItemChange(index, 'refId', ref.id);
                                  handleItemChange(index, 'busqueda', ref.nombre);
                                }}
                              >
                                {ref.nombre}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="ra-autocomplete-empty">
                            <i className="ti ti-search-off" /> Sin resultados para "{item.busqueda}"
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {errors.detallesItems?.[index]?.refId && (
                    <p className="ra-err">{errors.detallesItems[index].refId}</p>
                  )}
                </div>

                <div className="ra-group ra-group--cant">
                  <label className="ra-label">Cantidad <span className="ra-required">*</span></label>
                  <input type="text" inputMode="numeric" maxLength="3"
                    className={`ra-input ra-input--no-icon ${errors.detallesItems?.[index]?.cantidad ? 'ra-input--error' : ''}`}
                    placeholder="0" value={item.cantidad}
                    onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} />
                  {errors.detallesItems?.[index]?.cantidad && (
                    <p className="ra-err">{errors.detallesItems[index].cantidad}</p>
                  )}
                </div>

                <div className="ra-group ra-group--costo">
                  <label className="ra-label">Costo unitario <span className="ra-required">*</span></label>
                  <input type="text" inputMode="decimal" maxLength="20"
                    className={`ra-input ra-input--no-icon ${errors.detallesItems?.[index]?.costo ? 'ra-input--error' : ''}`}
                    placeholder="0.00" value={item.costo}
                    onChange={(e) => handleItemChange(index, 'costo', e.target.value)} />
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
