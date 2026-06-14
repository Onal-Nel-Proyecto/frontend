import { useState } from 'react'
import { FiPackage } from 'react-icons/fi'
import Drawer from '../../components/common/Drawer'
import './RegisterMaterial.css'

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const validate = (form) => {
  const errs = {}
  
  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del material es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 100) errs.nombre = 'Máximo 100 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'

  if (!form.tipoMaterial) errs.tipoMaterial = 'Indica el tipo de material'
  if (!form.unidadMedida) errs.unidadMedida = 'Indica la unidad de medida'

  const desc = form.descripcion.trim()
  if (!desc) errs.descripcion = 'Indica la descripción del material'
  else if (desc.length > 255) errs.descripcion = 'Máximo 255 caracteres'

  const umbralStr = form.umbralMinimo?.toString().trim()
  if (umbralStr === '') errs.umbralMinimo = 'Ingresa el stock mínimo'
  else if (!/^\d+$/.test(umbralStr)) errs.umbralMinimo = 'Solo números enteros'
  else if (parseInt(umbralStr, 10) < 0) errs.umbralMinimo = 'No puede ser negativo'

  return errs
}

const RegisterMaterial = ({ isOpen, onClose, initialData, onSave }) => {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    tipoMaterial: initialData?.tipo_material || '',
    unidadMedida: initialData?.unidad_medida || '',
    descripcion: initialData?.desc || '',
    umbralMinimo: initialData?.minStock?.toString() || '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    setTouched({ nombre: true, tipoMaterial: true, unidadMedida: true, descripcion: true, umbralMinimo: true })
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        nombre: form.nombre.trim(),
        tipoMaterial: form.tipoMaterial.trim(),
        unidadMedida: form.unidadMedida.trim(),
        descripcion: form.descripcion.trim(),
        umbralMinimo: parseInt(form.umbralMinimo, 10) || 0,
      })
    } finally {
      setSaving(false)
    }
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
            <label className="rm-label" htmlFor="rm-tipoMaterial">Tipo de material</label>
            <div className="rm-input-wrap">
              <i className="ti ti-category rm-input-icon" />
              <input id="rm-tipoMaterial" name="tipoMaterial" type="text" maxLength="60"
                className={`rm-input ${hasError('tipoMaterial') ? 'rm-input--error' : ''}`}
                placeholder="Ej: Tela, Hilo, Tinte, Forro" value={form.tipoMaterial}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('tipoMaterial') && <p className="rm-err">{errors.tipoMaterial}</p>}
          </div>
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-unidadMedida">Unidad de medida</label>
            <div className="rm-input-wrap">
              <i className="ti ti-ruler rm-input-icon" />
              <input id="rm-unidadMedida" name="unidadMedida" type="text" maxLength="20"
                className={`rm-input ${hasError('unidadMedida') ? 'rm-input--error' : ''}`}
                placeholder="Ej: mts, kg, unidades, rollos" value={form.unidadMedida}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('unidadMedida') && <p className="rm-err">{errors.unidadMedida}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group rm-group--full">
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
            <label className="rm-label" htmlFor="rm-umbralMinimo">Stock mínimo de seguridad</label>
            <div className="rm-input-wrap">
              <i className="ti ti-alert-triangle rm-input-icon" />
              <input id="rm-umbralMinimo" name="umbralMinimo" type="number" min="0"
                className={`rm-input ${hasError('umbralMinimo') ? 'rm-input--error' : ''}`}
                placeholder="0" value={form.umbralMinimo} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('umbralMinimo') && <p className="rm-err">{errors.umbralMinimo}</p>}
          </div>
        </div>
      </form>
    </Drawer>
  )
}

export default RegisterMaterial
