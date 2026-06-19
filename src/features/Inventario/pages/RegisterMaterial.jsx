import { useState } from 'react'
// ================================================================
// RegisterMaterial — Drawer para crear/editar materiales
// Soporta: nombre (máx 50), tipoMaterial, unidadMedida, stock mínimo
// ================================================================

import { FiPackage } from 'react-icons/fi'
import Drawer from '../../../components/common/Drawer'
import './RegisterMaterial.css'

const TIPOS_MATERIAL = [
  'TELA', 'HERRAMIENTA', 'HILO', 'BOTON', 'CREMALLERA',
  'ELASTICO', 'ENTRETELA', 'CORDON', 'ENCAJE',
  'APLIQUE', 'ETIQUETA', 'EMPAQUE', 'ACCESORIO',
]

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const validate = (form) => {
  const errs = {}

  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del material es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 50) errs.nombre = 'Máximo 50 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'

  if (!form.tipoMaterial) errs.tipoMaterial = 'Selecciona el tipo de material'

  const uni = form.unidadMedida.trim()
  if (uni.length > 20) errs.unidadMedida = 'Máximo 20 caracteres'
  else if (uni.length > 0 && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ.,\s]+$/.test(uni))
    errs.unidadMedida = 'Solo letras, puntos, comas y espacios'

  const desc = form.descripcion?.trim()
  if (desc.length > 200) errs.descripcion = 'Máximo 200 caracteres'

  const umbral = form.umbralMinimo?.toString().trim()
  if (umbral !== '' && umbral !== undefined) {
    if (!/^\d+$/.test(umbral)) errs.umbralMinimo = 'Solo números enteros'
    else {
      const n = parseInt(umbral, 10)
      if (n < 0) errs.umbralMinimo = 'No puede ser negativo'
      else if (n > 300) errs.umbralMinimo = 'Máximo 300'
    }
  }

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

    // Si es edición y no hay cambios, bloquear el guardado
    if (isEditing && Object.keys(newErrors).length === 0) {
      const orig = {
        nombre: initialData?.name?.trim() || '',
        tipoMaterial: initialData?.tipo_material || '',
        unidadMedida: initialData?.unidad_medida?.trim() || '',
        descripcion: initialData?.desc?.trim() || '',
        umbralMinimo: initialData?.minStock?.toString() || '',
      }
      const sinCambios =
        orig.nombre === form.nombre.trim() &&
        orig.tipoMaterial === form.tipoMaterial &&
        orig.unidadMedida === form.unidadMedida.trim() &&
        orig.descripcion === form.descripcion?.trim() &&
        orig.umbralMinimo === form.umbralMinimo?.toString().trim()
      if (sinCambios) {
        newErrors._general = 'No se detectaron cambios para guardar'
      }
    }

    setErrors(newErrors)
    setTouched({ nombre: true, tipoMaterial: true, unidadMedida: true, descripcion: true, umbralMinimo: true })
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        nombre: form.nombre.trim(),
        tipoMaterial: form.tipoMaterial.trim() || null,
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
        {errors._general && <div className="rm-err rm-err--general"><i className="ti ti-alert-triangle" /> {errors._general}</div>}
        <div className="rm-row">
          <div className="rm-group rm-group--full">
            <label className="rm-label" htmlFor="rm-nombre">Nombre del Material <span className="rm-required">*</span></label>
            <div className="rm-input-wrap">
              <i className="ti ti-tag rm-input-icon" />
              <input id="rm-nombre" name="nombre" type="text" maxLength="50"
                className={`rm-input ${hasError('nombre') ? 'rm-input--error' : ''}`}
                placeholder="Ej: Seda Natural China" value={form.nombre}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('nombre') && <p className="rm-err">{errors.nombre}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-tipoMaterial">Tipo de material <span className="rm-required">*</span></label>
            <div className="rm-input-wrap">
              <i className="ti ti-category rm-input-icon" />
              <select id="rm-tipoMaterial" name="tipoMaterial"
                className={`rm-input rm-select ${hasError('tipoMaterial') ? 'rm-input--error' : ''}`}
                value={form.tipoMaterial}
                onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                {TIPOS_MATERIAL.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
              <i className="ti ti-notes rm-input-icon" />
              <textarea id="rm-descripcion" name="descripcion" maxLength="200" rows="2"
                className={`rm-input ${hasError('descripcion') ? 'rm-input--error' : ''}`}
                placeholder="Descripción opcional del material..." value={form.descripcion}
                onChange={handleChange} onBlur={handleBlur}
                style={{ resize: 'vertical', paddingTop: '0.6rem', minHeight: '2.5rem' }} />
            </div>
            {hasError('descripcion') && <p className="rm-err">{errors.descripcion}</p>}
          </div>
        </div>

        <div className="rm-row">
          <div className="rm-group">
            <label className="rm-label" htmlFor="rm-umbralMinimo">Stock mínimo de seguridad</label>
            <div className="rm-input-wrap">
              <i className="ti ti-alert-triangle rm-input-icon" />
              <input id="rm-umbralMinimo" name="umbralMinimo" type="text" inputMode="numeric" maxLength="3"
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
