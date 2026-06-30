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

const UNIDADES_MEDIDA = [
  'Metros (mts)',
  'Centímetros (cm)',
  'Rollos',
  'Paquetes',
]

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const validate = (form, isEditing, existingMaterials, currentId) => {
  const errs = {}

  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del material es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 50) errs.nombre = 'Máximo 50 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'
  else {
    // Validar nombre duplicado (case-insensitive)
    const duplicado = existingMaterials.some(
      (m) => m.name?.toLowerCase() === nom.toLowerCase() && (!isEditing || m.id !== currentId)
    )
    if (duplicado) errs.nombre = 'Ya existe un material con este nombre'
  }

  if (!form.tipoMaterial) errs.tipoMaterial = 'Selecciona el tipo de material'

  if (form.cantidadInicial !== '') {
    const cant = Number(form.cantidadInicial)
    if (!Number.isInteger(cant) || cant < 0) errs.cantidadInicial = 'La cantidad debe ser un número entero ≥ 0'
    else if (cant > 1000) errs.cantidadInicial = 'Máximo 1000 unidades'
  }

  const desc = form.descripcion?.trim()
  if (desc.length > 200) errs.descripcion = 'Máximo 200 caracteres'

  if (form.umbralMinimo !== '' && form.umbralMinimo !== undefined && form.umbralMinimo !== null) {
    const num = Number(form.umbralMinimo)
    if (isNaN(num) || num < 0) errs.umbralMinimo = 'Debe ser un número mayor o igual a 0'
    else if (num > 100) errs.umbralMinimo = 'Máximo 100'
  }

  return errs
}

const RegisterMaterial = ({ isOpen, onClose, initialData, existingMaterials = [], onSave }) => {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    tipoMaterial: initialData?.tipo_material || '',
    unidadMedida: initialData?.unidad_medida || '',
    descripcion: initialData?.desc || '',
    stock: isEditing ? (initialData?.stock ?? 0) : 0,
    cantidadInicial: '',
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
    const newErrors = validate(form, isEditing, existingMaterials, initialData?.id)

    // Si es edición y no hay cambios, bloquear el guardado
    if (isEditing && Object.keys(newErrors).length === 0) {
      const orig = {
        nombre: initialData?.name?.trim() || '',
        tipoMaterial: initialData?.tipo_material || '',
        unidadMedida: initialData?.unidad_medida || '',
        descripcion: initialData?.desc?.trim() || '',
        umbralMinimo: initialData?.minStock?.toString() || '',
        stock: initialData?.stock?.toString() || '',
      }
      const sinCambios =
        orig.nombre === form.nombre.trim() &&
        orig.tipoMaterial === form.tipoMaterial &&
        orig.unidadMedida === form.unidadMedida &&
        orig.descripcion === form.descripcion?.trim() &&
        orig.umbralMinimo === form.umbralMinimo &&
        orig.stock === form.stock?.toString()
      if (sinCambios) {
        newErrors._general = 'No se detectaron cambios para guardar'
      }
    }

    setErrors(newErrors)
    setTouched({ nombre: true, tipoMaterial: true, unidadMedida: true, descripcion: true })
    if (Object.keys(newErrors).length > 0) return

    // Validar stock solo en edición
    if (isEditing) {
      const stockNum = Number(form.stock);
      if (isNaN(stockNum) || form.stock === '' || form.stock === null || form.stock === undefined) {
        setErrors((prev) => ({ ...prev, stock: 'El stock es obligatorio' }));
        setTouched((prev) => ({ ...prev, stock: true }));
        return;
      }
      if (stockNum < 0) {
        setErrors((prev) => ({ ...prev, stock: 'El stock no puede ser negativo' }));
        setTouched((prev) => ({ ...prev, stock: true }));
        return;
      }
    }

    setSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        nombre: form.nombre.trim(),
        tipoMaterial: form.tipoMaterial.trim() || null,
        unidadMedida: form.unidadMedida.trim(),
        descripcion: form.descripcion.trim(),
        umbralMinimo: Number(form.umbralMinimo) || 0,
        stock: isEditing ? Number(form.stock) : undefined,
        cantidadDisponible: isEditing ? undefined : (Number(form.cantidadInicial) || 0),
      })
    } catch (err) {
      console.error('Error al guardar material:', err)
      setErrors((prev) => ({ ...prev, _general: err?.response?.data?.message || err?.message || 'Error al guardar' }))
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
              <select id="rm-unidadMedida" name="unidadMedida"
                className={`rm-input rm-select ${hasError('unidadMedida') ? 'rm-input--error' : ''}`}
                value={form.unidadMedida}
                onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                {UNIDADES_MEDIDA.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            {hasError('unidadMedida') && <p className="rm-err">{errors.unidadMedida}</p>}
          </div>
        </div>

        {isEditing ? (
          <div className="rm-row">
            <div className="rm-group">
              <label className="rm-label" htmlFor="rm-stock">Stock actual</label>
              <div className="rm-input-wrap">
                <i className="ti ti-package rm-input-icon" />
                <input id="rm-stock" name="stock" type="text" inputMode="numeric"
                  className={`rm-input ${hasError('stock') ? 'rm-input--error' : ''}`}
                  value={form.stock}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') {
                      setForm((prev) => ({ ...prev, stock: '' }));
                      return;
                    }
                    const num = parseInt(raw, 10);
                    if (!isNaN(num) && num >= 0) {
                      const maxStock = initialData?.stock ?? 0;
                      setForm((prev) => ({ ...prev, stock: Math.min(num, maxStock) }));
                    }
                  }}
                  onBlur={handleBlur} />
              </div>
              {hasError('stock') && <p className="rm-err">{errors.stock}</p>}
              {!hasError('stock') && (
                <p className="rm-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Stock actual: {initialData?.stock ?? 0}. Solo puedes reducir.
                </p>
              )}
            </div>
            <div className="rm-group">
              <label className="rm-label" htmlFor="rm-umbralMinimo">Umbral mínimo</label>
              <div className="rm-input-wrap">
                <i className="ti ti-alert-triangle rm-input-icon" />
                <input id="rm-umbralMinimo" name="umbralMinimo" type="text" inputMode="numeric"
                  className={`rm-input ${hasError('umbralMinimo') ? 'rm-input--error' : ''}`}
                  placeholder="0" value={form.umbralMinimo}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '' || parseInt(raw, 10) <= 100) {
                      setForm((prev) => ({ ...prev, umbralMinimo: raw }));
                    }
                  }}
                  onBlur={handleBlur} />
              </div>
              {hasError('umbralMinimo') && <p className="rm-err">{errors.umbralMinimo}</p>}
              <p className="rm-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                0 = sin alerta. Máximo 100.
              </p>
            </div>
          </div>
        ) : (
          <div className="rm-row">
            <div className="rm-group">
              <label className="rm-label" htmlFor="rm-cantidadInicial">Cantidad inicial</label>
              <div className="rm-input-wrap">
                <i className="ti ti-package rm-input-icon" />
                <input id="rm-cantidadInicial" name="cantidadInicial" type="text" inputMode="numeric"
                  className={`rm-input ${hasError('cantidadInicial') ? 'rm-input--error' : ''}`}
                  placeholder="0" value={form.cantidadInicial}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') {
                      setForm((prev) => ({ ...prev, cantidadInicial: '' }));
                    } else {
                      const num = parseInt(raw, 10);
                      if (!isNaN(num)) {
                        setForm((prev) => ({ ...prev, cantidadInicial: String(Math.min(num, 1000)) }));
                      }
                    }
                  }}
                  onBlur={handleBlur} />
              </div>
              {hasError('cantidadInicial') && <p className="rm-err">{errors.cantidadInicial}</p>}
              <p className="rm-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Cantidad con la que se registrará en inventario.
              </p>
            </div>
            <div className="rm-group">
              <label className="rm-label" htmlFor="rm-umbralMinimo">Umbral mínimo</label>
              <div className="rm-input-wrap">
                <i className="ti ti-alert-triangle rm-input-icon" />
                <input id="rm-umbralMinimo" name="umbralMinimo" type="text" inputMode="numeric"
                  className={`rm-input ${hasError('umbralMinimo') ? 'rm-input--error' : ''}`}
                  placeholder="0" value={form.umbralMinimo}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '' || parseInt(raw, 10) <= 100) {
                      setForm((prev) => ({ ...prev, umbralMinimo: raw }));
                    }
                  }}
                  onBlur={handleBlur} />
              </div>
              {hasError('umbralMinimo') && <p className="rm-err">{errors.umbralMinimo}</p>}
              <p className="rm-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                0 = sin alerta. Máximo 100.
              </p>
            </div>
          </div>
        )}

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

      </form>
    </Drawer>
  )
}

export default RegisterMaterial
