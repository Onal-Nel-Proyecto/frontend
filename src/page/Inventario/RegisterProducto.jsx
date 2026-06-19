import { useState } from 'react'
import { FiTag } from 'react-icons/fi'
import Drawer from '../../components/common/Drawer'
import './RegisterProducto.css'

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

/** Opciones predefinidas para el campo Categoría */
const CATEGORIAS = ['Ropa de Dama', 'Ropa de Caballero', 'Accesorios', 'Uniformes', 'Otro']

const validate = (form) => {
  const errs = {}

  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del producto es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 70) errs.nombre = 'Máximo 70 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'

  if (!form.tipoProducto) errs.tipoProducto = 'Selecciona el tipo de producto'

  const precioStr = form.precio?.toString().trim()
  if (precioStr === '') errs.precio = 'Ingresa un precio válido'
  else if (!/^\d+(\.\d{1,2})?$/.test(precioStr)) errs.precio = 'Solo números (máx 2 decimales)'
  else {
    const precio = parseFloat(precioStr)
    if (precio <= 0) errs.precio = 'El precio debe ser mayor a $0'
    else if (precio > 999999999999) errs.precio = 'Máximo $999,999,999,999'
  }

  const tallaStr = form.talla?.trim()
  if (tallaStr.length > 10) errs.talla = 'Máximo 10 caracteres'

  return errs
}

const RegisterProducto = ({ isOpen, onClose, initialData, onSave }) => {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    tipoProducto: 'INVENTARIO',
    tipoPrenda: initialData?.tipo_prenda || '',
    categoria: initialData?.categoria || '',
    genero: initialData?.genero === 'Femenino' ? 'F' : initialData?.genero === 'Masculino' ? 'M' : initialData?.genero === 'Unisex' ? 'U' : initialData?.genero || '',
    talla: initialData?.talla || '',
    precio: initialData?.price?.toString() || '',
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
        tipoProducto: 'INVENTARIO',
        tipoPrenda: initialData?.tipo_prenda || '',
        categoria: initialData?.categoria || '',
        genero: initialData?.genero === 'Femenino' ? 'F' : initialData?.genero === 'Masculino' ? 'M' : initialData?.genero === 'Unisex' ? 'U' : initialData?.genero || '',
        talla: initialData?.talla?.trim() || '',
        precio: initialData?.price?.toString() || '',
      }
      const sinCambios =
        orig.nombre === form.nombre.trim() &&
        orig.tipoProducto === form.tipoProducto &&
        orig.tipoPrenda === form.tipoPrenda &&
        orig.categoria === form.categoria &&
        orig.genero === form.genero &&
        orig.talla === form.talla.trim() &&
        orig.precio === form.precio?.toString().trim()
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
        tipoProducto: form.tipoProducto,
        tipoPrenda: form.tipoPrenda,
        categoria: form.categoria,
        genero: form.genero,
        talla: form.talla.trim(),
        precio: parseFloat(form.precio) || 0,
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
                value={form.tipoPrenda} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="VESTIDO">Vestido</option>
                <option value="BLAZER">Blazer</option>
                <option value="CORBATA">Corbata</option>
                <option value="PAÑUELO">Pañuelo</option>
                <option value="CAMISA">Camisa</option>
                <option value="PANTALON">Pantalón</option>
                <option value="FALDA">Falda</option>
                <option value="CHAQUETA">Chaqueta</option>
                <option value="OTRO">Otro</option>
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
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group">
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

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-talla">Talla</label>
            <div className="rp-input-wrap">
              <i className="ti ti-ruler" />
              <input id="rp-talla" name="talla" type="text" maxLength="10" className={`rp-input ${hasError('talla') ? 'rp-input-wrap--err' : ''}`}
                placeholder="Ej: XS, S, M, L, XL, 38, 60, 90" value={form.talla}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('talla') && <p className="rp-err">{errors.talla}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-precio">Precio de venta ($)</label>
            <div className={`rp-input-wrap ${hasError('precio') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-currency-dollar" />
              <input id="rp-precio" name="precio" type="text" inputMode="decimal" className="rp-input"
                placeholder="0" value={form.precio} onChange={handleChange} onBlur={handleBlur} maxLength="15" />
            </div>
            {hasError('precio') && <p className="rp-err">{errors.precio}</p>}
          </div>
        </div>

      </form>
    </Drawer>
  )
}

export default RegisterProducto
