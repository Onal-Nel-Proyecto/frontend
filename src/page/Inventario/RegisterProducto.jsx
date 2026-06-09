import { useState } from 'react'
import { FiTag } from 'react-icons/fi'
import Drawer from '../../components/common/Drawer'
import './RegisterProducto.css'

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const validate = (form) => {
  const errs = {}
  
  const nom = form.nombre.trim()
  if (!nom) errs.nombre = 'El nombre del producto es obligatorio'
  else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres'
  else if (nom.length > 100) errs.nombre = 'Máximo 100 caracteres'
  else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números'

  const ref = form.referencia.trim()
  if (!ref) errs.referencia = 'La referencia es obligatoria'
  else if (ref.length < 3) errs.referencia = 'Mínimo 3 caracteres'
  else if (ref.length > 30) errs.referencia = 'Máximo 30 caracteres'
  else if (!/^[A-Z0-9-]+$/i.test(ref)) errs.referencia = 'Solo letras, números y guiones'

  if (!form.tipo_prenda) errs.tipo_prenda = 'Selecciona el tipo de prenda'
  if (!form.genero) errs.genero = 'Selecciona el género'

  const precioStr = form.precio.trim()
  if (precioStr === '') errs.precio = 'Ingresa un precio válido'
  else if (!/^\d+(\.\d{1,2})?$/.test(precioStr)) errs.precio = 'Solo números (máx 2 decimales)'
  else {
    const precio = parseFloat(precioStr)
    if (precio <= 0) errs.precio = 'El precio debe ser mayor a $0'
    else if (precio > 99999999) errs.precio = 'Precio demasiado alto'
  }

  // Stock es opcional
  const stockStr = form.stock.trim()
  if (stockStr !== '') {
    if (!/^\d+$/.test(stockStr)) errs.stock = 'Solo números enteros'
    else {
      const stock = parseInt(stockStr, 10)
      if (stock < 0) errs.stock = 'No puede ser negativo'
      else if (stock > 999999) errs.stock = 'Stock demasiado alto'
    }
  }

  return errs
}

const RegisterProducto = ({ isOpen, onClose, initialData, onSave }) => {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    referencia: initialData?.ref || '',
    descripcion: initialData?.descripcion || '',
    tipo_prenda: initialData?.tipo_prenda || '',
    genero: initialData?.genero || '',
    talla: initialData?.talla || '',
    precio: initialData?.price?.toString() || '',
    stock: initialData?.stock?.toString() || '',
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
    setTouched({ nombre: true, referencia: true, descripcion: true, tipo_prenda: true, genero: true, talla: true, precio: true, stock: true })
    if (Object.keys(newErrors).length > 0) return
    setSaving(true)
    setTimeout(() => {
      const stockNum = parseInt(form.stock, 10) || 0
      const saved = {
        id: initialData?.id,
        name: form.nombre.trim(),
        ref: form.referencia.trim(),
        descripcion: form.descripcion.trim(),
        tipo_prenda: form.tipo_prenda,
        genero: form.genero,
        talla: form.talla.trim(),
        price: parseFloat(form.precio) || 0,
        stock: stockNum,
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
        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-nombre">Nombre del Producto</label>
            <div className={`rp-input-wrap ${hasError('nombre') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-tag" />
              <input id="rp-nombre" name="nombre" type="text" maxLength="100" className="rp-input"
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
              <input id="rp-referencia" name="referencia" type="text" maxLength="30" className="rp-input"
                placeholder="Ej: VNS-001" value={form.referencia}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('referencia') && <p className="rp-err">{errors.referencia}</p>}
          </div>
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-descripcion">Descripción</label>
            <div className={`rp-input-wrap ${hasError('descripcion') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-list-details" />
              <input id="rp-descripcion" name="descripcion" type="text" maxLength="255" className="rp-input"
                placeholder="Ej: Vestido largo de seda natural con encaje" value={form.descripcion}
                onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('descripcion') && <p className="rp-err">{errors.descripcion}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-tipo_prenda">Tipo de prenda</label>
            <div className={`rp-input-wrap ${hasError('tipo_prenda') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-tag" />
              <select id="rp-tipo_prenda" name="tipo_prenda" className="rp-input rp-select"
                value={form.tipo_prenda} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="Vestido">Vestido</option>
                <option value="Blazer">Blazer</option>
                <option value="Corbata">Corbata</option>
                <option value="Pañuelo">Pañuelo</option>
                <option value="Camisa">Camisa</option>
                <option value="Pantalón">Pantalón</option>
                <option value="Falda">Falda</option>
                <option value="Chaqueta">Chaqueta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            {hasError('tipo_prenda') && <p className="rp-err">{errors.tipo_prenda}</p>}
          </div>
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-genero">Género</label>
            <div className={`rp-input-wrap ${hasError('genero') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-gender-male" />
              <select id="rp-genero" name="genero" className="rp-input rp-select"
                value={form.genero} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            {hasError('genero') && <p className="rp-err">{errors.genero}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-talla">Talla</label>
            <div className={`rp-input-wrap ${hasError('talla') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-ruler" />
              <input id="rp-talla" name="talla" type="text" maxLength="10" className="rp-input"
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
              <input id="rp-precio" name="precio" type="number" step="1" min="0" className="rp-input"
                placeholder="0" value={form.precio} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('precio') && <p className="rp-err">{errors.precio}</p>}
          </div>
        </div>

        <div className="rp-row">
          <div className="rp-group rp-group--full">
            <label className="rp-label" htmlFor="rp-stock">Stock inicial <span style={{fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:400}}>(opcional)</span></label>
            <div className={`rp-input-wrap ${hasError('stock') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-stack" />
              <input id="rp-stock" name="stock" type="number" min="0" className="rp-input"
                placeholder="0" value={form.stock} onChange={handleChange} onBlur={handleBlur} />
            </div>
            {hasError('stock') && <p className="rp-err">{errors.stock}</p>}
          </div>
        </div>


      </form>
    </Drawer>
  )
}

export default RegisterProducto