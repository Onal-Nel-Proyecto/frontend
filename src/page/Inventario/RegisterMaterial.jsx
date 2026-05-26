import { useState } from 'react'
import { FiPackage, FiSave } from 'react-icons/fi'
import Drawer from '../../components/common/Drawer'
import './RegisterMaterial.css'

const validate = (form) => {
  const errs = {}
  if (!form.nombre.trim()) errs.nombre = 'El nombre del material es obligatorio'
  else if (form.nombre.trim().length < 3) errs.nombre = 'Mínimo 3 caracteres'

  if (!form.referencia.trim()) errs.referencia = 'La referencia es obligatoria'
  else if (!/^[A-Z0-9-]+$/i.test(form.referencia.trim())) errs.referencia = 'Solo letras, números y guiones'

  if (!form.categoria) errs.categoria = 'Selecciona una categoría'

  if (!form.especificaciones.trim()) errs.especificaciones = 'Indica las especificaciones del material'

  const precio = parseFloat(form.precio)
  if (!form.precio || isNaN(precio)) errs.precio = 'Ingresa un precio válido'
  else if (precio <= 0) errs.precio = 'El precio debe ser mayor a $0'

  const stock = parseInt(form.stock)
  if (form.stock === '' || isNaN(stock)) errs.stock = 'Ingresa el stock actual'
  else if (stock < 0) errs.stock = 'No puede ser negativo'

  const min = parseInt(form.stockMinimo)
  if (form.stockMinimo === '' || isNaN(min)) errs.stockMinimo = 'Ingresa el stock mínimo'
  else if (min < 0) errs.stockMinimo = 'No puede ser negativo'
  else if (min > stock && stock >= 0) errs.stockMinimo = 'El mínimo no puede superar el stock actual'

  return errs
}

const RegisterMaterial = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    nombre: '', referencia: '', categoria: '', especificaciones: '',
    precio: '', stock: '', stockMinimo: '', estado: 'In Stock',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      const newForm = { ...form, [name]: value }
      const newErrors = validate(newForm)
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] || undefined }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validate(form)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] || undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    setTouched({ nombre: true, referencia: true, categoria: true, especificaciones: true, precio: true, stock: true, stockMinimo: true })
    if (Object.keys(newErrors).length > 0) return
    setSaving(true)
    setTimeout(() => {
      console.log('Material registrado:', form)
      setSaving(false)
      onClose()
    }, 800)
  }

  const hasError = (field) => touched[field] && errors[field]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Añadir Material"
      subtitle="Registra un nuevo material textil o acabado en el inventario."
      icon={<FiPackage />}
      footer={
        <>
          <button type="button" className="rm-btn rm-btn--outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="rm-form" className="rm-btn rm-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><i className="ti ti-loader ti-spin" /> Guardando…</> : <><i className="ti ti-device-floppy" /> Guardar Material</>}
          </button>
        </>
      }
    >
      <form id="rm-form" className="rm-form" onSubmit={handleSubmit} noValidate>
        <div className="rm-row">
          <div className="rm-group rm-group--full">
            <label className="rm-label" htmlFor="rm-nombre">Nombre del Material</label>
            <div className="rm-input-wrap">
              <i className="ti ti-tag rm-input-icon" />
              <input id="rm-nombre" name="nombre" type="text"
                className={`rm-input ${hasError('nombre') ? 'rm-input--error' : ''}`}
                placeholder="Ej: Seda Natural China" value={form.nombre}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('nombre') && <p className="rm-err">{errors.nombre}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-referencia">Referencia</label>
            <div className="rm-input-wrap">
              <i className="ti ti-barcode rm-input-icon" />
              <input id="rm-referencia" name="referencia" type="text"
                className={`rm-input ${hasError('referencia') ? 'rm-input--error' : ''}`}
                placeholder="Ej: SNC-001" value={form.referencia}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('referencia') && <p className="rm-err">{errors.referencia}</p>}
          </div>
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-categoria">Categoría</label>
            <div className="rm-input-wrap">
              <i className="ti ti-category rm-input-icon" />
              <select id="rm-categoria" name="categoria"
                className={`rm-input rm-select ${hasError('categoria') ? 'rm-input--error' : ''}`}
                value={form.categoria} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="Telas de Seda">Telas de Seda</option>
                <option value="Linos">Linos</option>
                <option value="Terciopelos">Terciopelos</option>
                <option value="Tintes y Acabados">Tintes y Acabados</option>
              </select>
            </div>
            {hasError('categoria') && <p className="rm-err">{errors.categoria}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group rm-group--full">
            <label className="rm-label" htmlFor="rm-especificaciones">Especificaciones</label>
            <div className="rm-input-wrap">
              <i className="ti ti-list-details rm-input-icon" />
              <input id="rm-especificaciones" name="especificaciones" type="text"
                className={`rm-input ${hasError('especificaciones') ? 'rm-input--error' : ''}`}
                placeholder="Ej: 5.5 mm, 12 mm, 120 g/m²" value={form.especificaciones}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('especificaciones') && <p className="rm-err">{errors.especificaciones}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group rm-group--full">
            <label className="rm-label" htmlFor="rm-precio">Precio por metro ($)</label>
            <div className="rm-input-wrap">
              <i className="ti ti-currency-dollar rm-input-icon" />
              <input id="rm-precio" name="precio" type="number" step="1" min="0"
                className={`rm-input ${hasError('precio') ? 'rm-input--error' : ''}`}
                placeholder="0" value={form.precio} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('precio') && <p className="rm-err">{errors.precio}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-stock">Stock actual (mts)</label>
            <div className="rm-input-wrap">
              <i className="ti ti-stack rm-input-icon" />
              <input id="rm-stock" name="stock" type="number" min="0"
                className={`rm-input ${hasError('stock') ? 'rm-input--error' : ''}`}
                placeholder="0" value={form.stock} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('stock') && <p className="rm-err">{errors.stock}</p>}
          </div>
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-stockMinimo">Stock mínimo</label>
            <div className="rm-input-wrap">
              <i className="ti ti-alert-triangle rm-input-icon" />
              <input id="rm-stockMinimo" name="stockMinimo" type="number" min="0"
                className={`rm-input ${hasError('stockMinimo') ? 'rm-input--error' : ''}`}
                placeholder="0" value={form.stockMinimo} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('stockMinimo') && <p className="rm-err">{errors.stockMinimo}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group rm-group--full">
            <label className="rm-label" htmlFor="rm-estado">Estado</label>
            <div className="rm-input-wrap">
              <i className="ti ti-circle-check rm-input-icon" />
              <select id="rm-estado" name="estado" className="rm-input rm-select"
                value={form.estado} onChange={handleChange}>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Sin Stock">Sin Stock</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  )
}

export default RegisterMaterial