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

  if (!form.categoria) errs.categoria = 'Selecciona una categoría'
  if (!form.tipo) errs.tipo = 'Selecciona el tipo de producto'
  if (!form.genero) errs.genero = 'Selecciona el género'
  if (!form.talla) errs.talla = 'Selecciona la talla'

  const precioStr = form.precio.trim()
  if (precioStr === '') errs.precio = 'Ingresa un precio válido'
  else if (!/^\d+(\.\d{1,2})?$/.test(precioStr)) errs.precio = 'Solo números (máx 2 decimales)'
  else {
    const precio = parseFloat(precioStr)
    if (precio <= 0) errs.precio = 'El precio debe ser mayor a $0'
    else if (precio > 99999999) errs.precio = 'Precio demasiado alto'
  }

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

const RegisterProducto = ({ isOpen, onClose, initialData, onSave }) => {
  const isEditing = !!initialData

  const [form, setForm] = useState({
    nombre: initialData?.name || '',
    referencia: initialData?.ref || '',
    categoria: initialData?.category || '',
    tipo: initialData?.tipo || '',
    genero: initialData?.genero || '',
    talla: initialData?.talla || '',
    precio: initialData?.price?.toString() || '',
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
    // La validación solo se activa en submit
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    setTouched({ nombre: true, referencia: true, categoria: true, tipo: true, genero: true, talla: true, precio: true, stock: true, stockMinimo: true })
    if (Object.keys(newErrors).length > 0) return
    setSaving(true)
    setTimeout(() => {
      const stockNum = parseInt(form.stock, 10) || 0
      const saved = {
        id: initialData?.id,
        name: form.nombre.trim(),
        ref: form.referencia.trim(),
        category: form.categoria,
        tipo: form.tipo,
        genero: form.genero,
        talla: form.talla,
        price: parseFloat(form.precio) || 0,
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
          <div className="rp-group">
            <label className="rp-label" htmlFor="rp-tipo">Tipo de producto</label>
            <div className={`rp-input-wrap ${hasError('tipo') ? 'rp-input-wrap--err' : ''}`}>
              <i className="ti ti-tag" />
              <select id="rp-tipo" name="tipo" className="rp-input rp-select"
                value={form.tipo} onChange={handleChange} onBlur={handleBlur}>
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
            {hasError('tipo') && <p className="rp-err">{errors.tipo}</p>}
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
              <select id="rp-talla" name="talla" className="rp-input rp-select"
                value={form.talla} onChange={handleChange} onBlur={handleBlur}>
                <option value="">Seleccione...</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="Única">Talla Única</option>
              </select>
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


      </form>
    </Drawer>
  )
}

export default RegisterProducto