import { useState, useEffect, useMemo } from 'react'
import { FiTag, FiLock } from 'react-icons/fi'
import Drawer from '../../../../components/common/Drawer'
import { getCategorias } from '../../../../services/categoriaService'
import { isAdmin } from '../../../../utils/session'
import './RegisterProducto.css'

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const validate = (form) => {
  const errs = {}

  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del producto es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 70) errs.nombre = 'Máximo 70 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'

  if (form.cantidadInicial !== '') {
    const cant = Number(form.cantidadInicial)
    if (!Number.isInteger(cant) || cant < 0) errs.cantidadInicial = 'La cantidad debe ser un número entero ≥ 0'
    else if (cant > 1000) errs.cantidadInicial = 'Máximo 1000 unidades'
  }

  if (form.umbralMinimo !== '' && form.umbralMinimo !== undefined && form.umbralMinimo !== null) {
    const num = Number(form.umbralMinimo)
    if (isNaN(num) || num < 0) errs.umbralMinimo = 'Debe ser un número mayor o igual a 0'
    else if (num > 100) errs.umbralMinimo = 'Máximo 100'
  }

  const precioStr = form.precio?.toString().trim()
  if (precioStr === '') errs.precio = 'Ingresa un precio válido'
  else if (!/^\d+(\.\d{1,2})?$/.test(precioStr)) errs.precio = 'Solo números (máx 2 decimales)'
  else {
    const precio = parseFloat(precioStr)
    if (precio <= 0) errs.precio = 'El precio debe ser mayor a $0'
    else if (precio > 999999999999) errs.precio = 'Máximo $999,999,999,999'
  }

  return errs
}

const RegisterProducto = ({ isOpen, onClose, initialData, onSave }) => {
  const isEditing = !!initialData

  /** Limpia el sentinela '—' que usa el mapper para la tabla */
  const clean = (val) => (val && val !== '—' ? val : '')

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    tipoPrenda: clean(initialData?.tipo_prenda),
    categoria: clean(initialData?.categoria),
    genero: initialData?.genero === 'Femenino' ? 'F' : initialData?.genero === 'Masculino' ? 'M' : initialData?.genero === 'Unisex' ? 'U' : clean(initialData?.genero),
    talla: clean(initialData?.talla),
    precio: initialData?.price?.toString() || '',
    cantidadInicial: '',
    umbralMinimo: initialData?.minStock?.toString() || '',
  })
  const [categorias, setCategorias] = useState([])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  // Cargar categorías activas desde la API al abrir el drawer
  useEffect(() => {
    if (!isOpen) return
    let cancel = false
    const fetchCat = async () => {
      try {
        const resp = await getCategorias(1, { estado: 'ACTIVO' })
        const cats = resp.data || []
        if (!cancel) {
          setCategorias(cats)
          // Si estamos editando, convertir el nombre de categoría a ID
          const catName = clean(initialData?.categoria)
          if (catName) {
            const match = cats.find(c => (c.cat_nom || c.nombre) === catName)
            if (match) setForm(prev => ({ ...prev, categoria: String(match.cat_id || match.id) }))
          }
        }
      } catch {
        if (!cancel) setCategorias([])
      }
    }
    fetchCat()
    return () => { cancel = true }
  }, [isOpen])

  // ─── Datos derivados de la categoría seleccionada ───
  const categoriaSel = useMemo(
    () => categorias.find((c) => String(c.cat_id || c.id) === String(form.categoria)) || null,
    [categorias, form.categoria]
  )

  const tipoPrendaOptions = categoriaSel?.categoria_tipo_prenda || categoriaSel?.catTipsPrendas || []
  const tallaOptions = categoriaSel?.categoria_talla_referencia || categoriaSel?.catTallaRef || []

  // ─── Resetear tipoPrenda / talla al cambiar de categoría ───
  // Solo resetea si el valor actual NO viene de initialData (producto existente)
  const tipoPrendaOriginal = isEditing && initialData?.tipo_prenda ? clean(initialData?.tipo_prenda) : null
  const tallaOriginal = isEditing && initialData?.talla ? clean(initialData?.talla) : null

  useEffect(() => {
    if (!form.categoria) return
    if (form.tipoPrenda && tipoPrendaOptions.length > 0 && !tipoPrendaOptions.includes(form.tipoPrenda)) {
      if (form.tipoPrenda !== tipoPrendaOriginal) {
        setForm((prev) => ({ ...prev, tipoPrenda: '' }))
      }
    }
    if (form.talla && tallaOptions.length > 0 && !tallaOptions.includes(form.talla)) {
      if (form.talla !== tallaOriginal) {
        setForm((prev) => ({ ...prev, talla: '' }))
      }
    }
  }, [form.categoria, tipoPrendaOptions, tallaOptions])

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

    // Validar tipo de prenda si la categoría tiene opciones definidas
    if (form.categoria && tipoPrendaOptions.length > 0 && !form.tipoPrenda) {
      newErrors.tipoPrenda = 'Selecciona el tipo de prenda'
    }

    // Si es edición y no hay cambios, bloquear el guardado
    if (isEditing && Object.keys(newErrors).length === 0) {
      // La categoría en el form se convierte de nombre a ID vía useEffect,
      // así que comparamos el nombre original contra el nombre resuelto
      const catNameActual = categoriaSel?.['cat_nom'] || categoriaSel?.nombre || ''
      const orig = {
        nombre: initialData?.name?.trim() || '',
        tipoPrenda: clean(initialData?.tipo_prenda),
        categoria: clean(initialData?.categoria),
        genero: initialData?.genero === 'Femenino' ? 'F' : initialData?.genero === 'Masculino' ? 'M' : initialData?.genero === 'Unisex' ? 'U' : clean(initialData?.genero),
        talla: clean(initialData?.talla),
        precio: initialData?.price?.toString() || '',
        umbralMinimo: initialData?.minStock?.toString() || '',
      }
      const sinCambios =
        orig.nombre === form.nombre.trim() &&
        orig.tipoPrenda === form.tipoPrenda &&
        orig.categoria === catNameActual &&
        orig.genero === form.genero &&
        orig.talla === form.talla.trim() &&
        orig.precio === form.precio?.toString().trim() &&
        orig.umbralMinimo === form.umbralMinimo
      if (sinCambios) {
        newErrors._general = 'No se detectaron cambios para guardar'
      }
    }

    setErrors(newErrors)
    setTouched({ nombre: true, precio: true, talla: true })
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      await onSave({
        id: initialData?.id,
        nombre: form.nombre.trim(),
        tipoPrenda: form.tipoPrenda || null,
        categoriaId: form.categoria || null,
        genero: form.genero || null,
        talla: form.talla.trim() || null,
        precio: parseFloat(form.precio) || 0,
        cantidadDisponible: isEditing ? undefined : (Number(form.cantidadInicial) || 0),
        umbralMinimo: Number(form.umbralMinimo) || 0,
      })
    } catch (err) {
      console.error('Error al guardar producto:', err)
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
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      subtitle={isEditing ? 'Modifica los datos del producto.' : 'Añade un nuevo producto confeccionado al catálogo.'}
      icon={<FiTag />}
      footer={
        <>
          <button type="button" className="rp-btn rp-btn--outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="rp-form" className="rp-btn rp-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><i className="ti ti-loader ti-spin" /> Guardando…</> : <><i className="ti ti-device-floppy" /> {isEditing ? 'Guardar Cambios' : 'Guardar Producto'}</>}
          </button>
        </>
      }
    >
      <form id="rp-form" className="rp-form" onSubmit={handleSubmit} noValidate>
        {errors._general && <div className="rp-err rp-err--general"><i className="ti ti-alert-triangle" /> {errors._general}</div>}
        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-nombre">Nombre del Producto</label>
            <div className={`rp-input-wrap ${hasError('nombre') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-tag" />
              <input id="rp-nombre" name="nombre" type="text" maxLength="70" className="rp-input"
                placeholder="Ej: Vestido de Noche Seda" value={form.nombre}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('nombre') && <p className="rp-err">{errors.nombre}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-tipoPrenda">Tipo de prenda</label>
            <div className="rp-input-wrap">
              <i className="ti ti-tag" />
              <select id="rp-tipoPrenda" name="tipoPrenda" className="rp-input rp-select"
                value={form.tipoPrenda} onChange={handleChange} onBlur={handleBlur}
                disabled={!form.categoria}>
                <option value="">Seleccione...</option>
                {tipoPrendaOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-categoria">Categoría</label>
            <div className="rp-input-wrap">
              <i className="ti ti-category" />
              <select id="rp-categoria" name="categoria" className="rp-input rp-select"
                value={form.categoria} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                {categorias.map((cat) => (
                  <option key={cat.cat_id || cat.id} value={cat.cat_id || cat.id}>{cat.cat_nom || cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rp-row">
          {/* <div className="rp-group">
            <label className="rp-label" htmlFor="rp-tipoProducto">Tipo de producto <span className="rp-required">*</span></label>
            <div className="rp-input-wrap">
              <i className="ti ti-tag" />
              <select id="rp-tipoProducto" name="tipoProducto" className={`rp-input rp-select ${hasError('tipoProducto') ? 'rp-input-wrap--err' : ''}`}
                value={form.tipoProducto} onChange={handleChange} onBlur={handleBlur}>
                <option value="INVENTARIO">Inventario</option>
                <option value="PERSONALIZADO">Personalizado</option>
              </select>
            </div>
            {hasError('tipoProducto') && <p className="rp-err">{errors.tipoProducto}</p>}
          </div> */}
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-talla">Talla</label>
            <div className="rp-input-wrap">
              <i className="ti ti-ruler" />
              <select id="rp-talla" name="talla" className="rp-input rp-select"
                value={form.talla} onChange={handleChange} onBlur={handleBlur}
                disabled={!form.categoria}>
                <option value="">Seleccione...</option>
                {tallaOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-genero">Género</label>
            <div className="rp-input-wrap">
              <i className="ti ti-gender-male" />
              <select id="rp-genero" name="genero" className="rp-input rp-select"
                value={form.genero} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="U">Unisex</option>
              </select>
            </div>
          </div>
        </div>

        {/* <div className="rp-row">
        </div> */}

        <div className="rp-row">
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-precio">Precio de venta ($)</label>
            <div className={`rp-input-wrap ${hasError('precio') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-currency-dollar" />
              <input id="rp-precio" name="precio" type="text" inputMode="decimal" className="rp-input"
                placeholder="0" value={form.precio} onChange={handleChange} onBlur={handleBlur} maxLength="15" />
            </div>
            {hasError('precio') && <p className="rp-err">{errors.precio}</p>}
          </div>
          {isEditing ? (
            <div className="rp-group">
              <label className="rp-label">Stock actual</label>
              <div className="rp-input-wrap" style={{ opacity: 0.7 }}>
                <i className="ti ti-package" />
                <span className="rp-input" style={{ padding: '0.6rem 0', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {initialData?.stock ?? 0}
                </span>
              </div>
              <p className="rp-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Stock disponible en inventario.
              </p>
            </div>
          ) : (
            <div className="rp-group">
              <label className="rp-label" htmlFor="rp-cantidadInicial">Cantidad inicial</label>
              <div className={`rp-input-wrap ${hasError('cantidadInicial') ? 'rp-input-wrap--err' : ''}`}>
                <i className="ti ti-package" />
                <input id="rp-cantidadInicial" name="cantidadInicial" type="text" inputMode="numeric" className="rp-input"
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
              {hasError('cantidadInicial') && <p className="rp-err">{errors.cantidadInicial}</p>}
              <p className="rp-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Cantidad que se registrará en el inventario.
              </p>
            </div>
          )}
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-umbralMinimo">Umbral mínimo</label>
            <div className={`rp-input-wrap ${hasError('umbralMinimo') ? 'rp-input-wrap--err' : ''} ${!isAdmin() ? 'rp-input-wrap--disabled' : ''}`}>
              {!isAdmin() ? <FiLock style={{ fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.5 }} /> : <i className="ti ti-alert-triangle" />}
              <input id="rp-umbralMinimo" name="umbralMinimo" type="text" inputMode="numeric" className="rp-input"
                placeholder="0" value={form.umbralMinimo}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw === '' || parseInt(raw, 10) <= 100) {
                    setForm((prev) => ({ ...prev, umbralMinimo: raw }));
                  }
                }}
                onBlur={handleBlur}
                disabled={!isAdmin()} />
            </div>
            {hasError('umbralMinimo') && <p className="rp-err">{errors.umbralMinimo}</p>}
            {!isAdmin() ? (
              <p className="rp-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <FiLock size={11} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Solo administradores pueden modificar este valor.
              </p>
            ) : (
              <p className="rp-hint" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                0 = sin alerta. Máximo 100.
              </p>
            )}
          </div>
        </div>

      </form>
    </Drawer>
  )
}

export default RegisterProducto
