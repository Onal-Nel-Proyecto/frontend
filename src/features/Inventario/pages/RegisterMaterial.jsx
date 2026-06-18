import { useState } from 'react'
import { FiPackage, FiSave } from 'react-icons/fi'
import Drawer from '../../../components/common/Drawer'

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const validate = (form) => {
  const errs = {}
  
  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del material es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 100) errs.nombre = 'Máximo 100 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'

  const ref = form.referencia.trim()
  if (!ref) errs.referencia = 'La referencia es obligatoria'
  else if (ref.length < 3) errs.referencia = 'Mínimo 3 caracteres'
  else if (ref.length > 30) errs.referencia = 'Máximo 30 caracteres'
  else if (!/^[A-Z0-9-]+$/i.test(ref)) errs.referencia = 'Solo letras, números y guiones'

  if (!form.tipo_material) errs.tipo_material = 'Indica el tipo de material'

  if (!form.unidad_medida) errs.unidad_medida = 'Indica la unidad de medida'

  const desc = form.descripcion.trim()
  if (!desc) errs.descripcion = 'Indica la descripción del material'
  else if (desc.length > 255) errs.descripcion = 'Máximo 255 caracteres'

  const stockStr = form.stock.trim()
  if (stockStr === '') errs.stock = 'Ingresa el stock actual'
  else if (!/^\d+$/.test(stockStr)) errs.stock = 'Solo números enteros'
  else {
    const stock = parseInt(stockStr, 10)
    if (stock < 0) errs.stock = 'No puede ser negativo'
    else if (stock > 999999) errs.stock = 'Stock demasiado alto'

    const minStr = form.stockMinimo.trim()
    if (minStr === '') errs.stockMinimo = 'Ingresa el stock mínimo'
    else if (!/^\d+$/.test(minStr)) errs.stockMinimo = 'Solo números enteros'
    else {
      const min = parseInt(minStr, 10)
      if (min < 0) errs.stockMinimo = 'No puede ser negativo'
      else if (min > stock) errs.stockMinimo = 'El mínimo no puede superar el stock actual'
    }
  }

  return errs
}

const RegisterMaterial = ({ isOpen, onClose, initialData, onSave }) => {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    referencia: initialData?.ref || '',
    tipo_material: initialData?.tipo_material || '',
    unidad_medida: initialData?.unidad_medida || '',
    descripcion: initialData?.desc || '',
    stock: initialData?.stock?.toString() || '',
    stockMinimo: initialData?.minStock?.toString() || '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    setTouched({ nombre: true, referencia: true, tipo_material: true, unidad_medida: true, descripcion: true, stock: true, stockMinimo: true })
    if (Object.keys(newErrors).length > 0) return
    setSaving(true)
    setTimeout(() => {
      const stockNum = parseInt(form.stock, 10) || 0
      const saved = {
        id: initialData?.id,
        name: form.nombre.trim(),
        ref: form.referencia.trim(),
        tipo_material: form.tipo_material.trim(),
        unidad_medida: form.unidad_medida.trim(),
        desc: form.descripcion.trim(),
        stock: stockNum,
        minStock: parseInt(form.stockMinimo, 10) || 0,
        status: stockNum === 0 ? 'agotado' : 'disponible',
      }
      onSave?.(saved)
      setSaving(false)
    }, 800)
  }

  const hasError = (field) => touched[field] && errors[field]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Material' : 'Añadir Material'}
      subtitle={isEditing ? 'Modifica los datos del material.' : 'Registra un nuevo material textil o acabado en el inventario.'}
      icon={<FiPackage />}
      footer={
        <>
          <button type="button" className="rm-btn rm-btn--outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="rm-form" className="rm-btn rm-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><i className="ti ti-loader ti-spin" /> Guardando…</> : <><i className="ti ti-device-floppy" /> {isEditing ? 'Guardar Cambios' : 'Guardar Material'}</>}
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
              <input id="rm-nombre" name="nombre" type="text" maxLength="100"
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
              <input id="rm-referencia" name="referencia" type="text" maxLength="30"
                className={`rm-input ${hasError('referencia') ? 'rm-input--error' : ''}`}
                placeholder="Ej: SNC-001" value={form.referencia}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('referencia') && <p className="rm-err">{errors.referencia}</p>}
          </div>
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-tipo_material">Tipo de material</label>
            <div className="rm-input-wrap">
              <i className="ti ti-category rm-input-icon" />
              <input id="rm-tipo_material" name="tipo_material" type="text" maxLength="60"
                className={`rm-input ${hasError('tipo_material') ? 'rm-input--error' : ''}`}
                placeholder="Ej: Tela, Hilo, Tinte, Forro" value={form.tipo_material}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('tipo_material') && <p className="rm-err">{errors.tipo_material}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-unidad_medida">Unidad de medida</label>
            <div className="rm-input-wrap">
              <i className="ti ti-ruler rm-input-icon" />
              <input id="rm-unidad_medida" name="unidad_medida" type="text" maxLength="20"
                className={`rm-input ${hasError('unidad_medida') ? 'rm-input--error' : ''}`}
                placeholder="Ej: mts, kg, unidades, rollos" value={form.unidad_medida}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('unidad_medida') && <p className="rm-err">{errors.unidad_medida}</p>}
          </div>
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-descripcion">Descripción</label>
            <div className="rm-input-wrap">
              <i className="ti ti-list-details rm-input-icon" />
              <input id="rm-descripcion" name="descripcion" type="text" maxLength="255"
                className={`rm-input ${hasError('descripcion') ? 'rm-input--error' : ''}`}
                placeholder="Ej: 5.5 mm, 12 mm, 120 g/m²" value={form.descripcion}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('descripcion') && <p className="rm-err">{errors.descripcion}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-stock">Stock actual</label>
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


      </form>
    </Drawer>
  )
}

export default RegisterMaterial