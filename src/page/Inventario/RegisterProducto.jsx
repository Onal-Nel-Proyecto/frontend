import { useState } from 'react'
import { FiTag } from 'react-icons/fi'
import Drawer from '../../components/common/Drawer'
import './RegisterProducto.css'

const validate = (form) => {
  const errs = {}
  if (!form.nombre.trim()) errs.nombre = 'El nombre del producto es obligatorio'
  else if (form.nombre.trim().length < 3) errs.nombre = 'Mínimo 3 caracteres'

  if (!form.referencia.trim()) errs.referencia = 'La referencia es obligatoria'
  else if (!/^[A-Z0-9-]+$/i.test(form.referencia.trim())) errs.referencia = 'Solo letras, números y guiones'

  if (!form.categoria) errs.categoria = 'Selecciona una categoría'

  if (!form.material.trim()) errs.material = 'Indica el material principal'

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

const RegisterProducto = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    nombre: '', referencia: '', categoria: '', material: '',
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
    setTouched({ nombre: true, referencia: true, categoria: true, material: true, precio: true, stock: true, stockMinimo: true })
    if (Object.keys(newErrors).length > 0) return
    setSaving(true)
    setTimeout(() => {
      console.log('Producto registrado:', form)
      setSaving(false)
      onClose()
    }, 800)
  }

  const hasError = (field) => touched[field] && errors[field]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Producto"
      subtitle="Añade un nuevo producto confeccionado al catálogo."
      icon={<FiTag />}
      footer={
        <>
          <button type="button" className="rp-btn rp-btn--outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="rp-form" className="rp-btn rp-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><i className="ti ti-loader ti-spin" /> Guardando…</> : <><i className="ti ti-device-floppy" /> Guardar Producto</>}
          </button>
        </>
      }
    >
      <form id="rp-form" className="rp-form" onSubmit={handleSubmit} noValidate>
        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-nombre">Nombre del Producto</label>
            <div className={`rp-input-wrap ${hasError('nombre') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-tag" />
              <input id="rp-nombre" name="nombre" type="text" className="rp-input"
                placeholder="Ej: Vestido de Noche Seda" value={form.nombre}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('nombre') && <p className="rp-err">{errors.nombre}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-referencia">Referencia</label>
            <div className={`rp-input-wrap ${hasError('referencia') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-barcode" />
              <input id="rp-referencia" name="referencia" type="text" className="rp-input"
                placeholder="Ej: VNS-001" value={form.referencia}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('referencia') && <p className="rp-err">{errors.referencia}</p>}
          </div>
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-categoria">Categoría</label>
            <div className={`rp-input-wrap ${hasError('categoria') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-category" />
              <select id="rp-categoria" name="categoria" className="rp-input rp-select"
                value={form.categoria} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="Vestidos">Vestidos</option>
                <option value="Chaquetas">Chaquetas</option>
                <option value="Accesorios">Accesorios</option>
              </select>
            </div>
            {hasError('categoria') && <p className="rp-err">{errors.categoria}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-material">Material principal</label>
            <div className={`rp-input-wrap ${hasError('material') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-rollers" />
              <input id="rp-material" name="material" type="text" className="rp-input"
                placeholder="Ej: Seda Natural China" value={form.material}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('material') && <p className="rp-err">{errors.material}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-precio">Precio de venta ($)</label>
            <div className={`rp-input-wrap ${hasError('precio') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-currency-dollar" />
              <input id="rp-precio" name="precio" type="number" step="1" min="0" className="rp-input"
                placeholder="0" value={form.precio} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('precio') && <p className="rp-err">{errors.precio}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-stock">Stock actual</label>
            <div className={`rp-input-wrap ${hasError('stock') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-stack" />
              <input id="rp-stock" name="stock" type="number" min="0" className="rp-input"
                placeholder="0" value={form.stock} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('stock') && <p className="rp-err">{errors.stock}</p>}
          </div>
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-stockMinimo">Stock mínimo</label>
            <div className={`rp-input-wrap ${hasError('stockMinimo') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-alert-triangle" />
              <input id="rp-stockMinimo" name="stockMinimo" type="number" min="0" className="rp-input"
                placeholder="0" value={form.stockMinimo} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('stockMinimo') && <p className="rp-err">{errors.stockMinimo}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-estado">Estado</label>
            <div className="rp-input-wrap">
              <i className="ti ti-circle-check" />
              <select id="rp-estado" name="estado" className="rp-input rp-select" value={form.estado} onChange={handleChange}>
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

export default RegisterProducto