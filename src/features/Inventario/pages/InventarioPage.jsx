// ================================================================
// InventarioPage — Página principal del módulo de Inventario
// Gestiona tres sub-pestañas: Materiales, Productos, Abastecimiento
// Cada pestaña tiene su propia tabla, filtros, estadísticas y CRUD
// ================================================================

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import RegisterMaterial from './RegisterMaterial'
import RegisterProducto from './RegisterProducto'
import RegisterAbastecimiento from './RegisterAbastecimiento'
import MovimientosPage from './MovimientosPage'
import { useAbastecimiento } from '../../../hooks/useAbastecimiento'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { getMateriales, createMaterial, updateMaterial, changeMaterialEstado } from '../../../api/materialesService'
import { getProductos, getProductoById, createProducto, updateProducto, changeProductoEstado } from '../../../api/productosApiService'
import Alert from '../../../components/ui/feedback/Alert'
import './InventarioPage.css'

// ════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════

/** Formatea un número como moneda COP (sin decimales) */
const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// ════════════════════════════════════════════
//  TRANSFORMADORES API → TABLA (mappers)
//  Convierten la respuesta cruda del backend
//  al formato que espera la tabla (TablaSection)
// ════════════════════════════════════════════

const mapperMaterial = (m) => ({
  id: m.id,
  name: m.nombre || '—',
  ref: m.referencia || m.id || '—',
  tipo_material: m.tipoMaterial || '—',
  unidad_medida: m.unidadMedida || '—',
  desc: m.descripcion || '—',
  stock: Number(m.cantidadDisponible ?? m.stock ?? 0),
  minStock: Number(m.umbralMinimo || 0),
  status: (m.estado || '').toLowerCase(),
})

const mapperProducto = (p) => ({
  id: p.id,
  name: p.nombre || '—',
  ref: p.referencia || p.id || '—',
  descripcion: p.descripcion || '—',
  tipo_prenda: p.tipoPrenda || '—',
  categoria: p.categoria || '—',
  genero: p.genero || '—',
  talla: p.talla || '—',
  price: Number(p.precioUnitario || 0),
  stock: Number(p.cantidadDisponible ?? p.stock ?? 0),
  minStock: Number(p.umbralMinimo || 0),
  tipoProducto: p.tipoProducto || 'INVENTARIO',
  status: typeof p.estado === 'string' ? p.estado.toLowerCase() : p.estado === 1 ? 'disponible' : p.estado === 2 ? 'agotado' : 'eliminado',
})

// ════════════════════════════════════════════
//  COMPONENTES INTERNOS
// ════════════════════════════════════════════

/**
 * StockBar — Barra de progreso visual del stock
 * @param {number} current - Stock actual
 * @param {number} min     - Stock mínimo (umbral)
 * Color verde si hay stock suficiente,
 * naranja si está cerca del mínimo, rojo si está en 0
 */
const StockBar = ({ current, min }) => {
  const pct = Math.min((current / Math.max(min, 1)) * 100, 100)
  const color = current === 0 ? '#e74c3c' : current <= min ? '#e67e22' : '#2e7d32'
  return (
    <div className="inv-stockbar-track">
      <div className="inv-stockbar-fill" style={{ width: `${pct}%`, background: color }} />
      <span className="inv-stockbar-label" style={{ color }}>
        {current} <small>{current <= min ? '⚠' : ''}</small>
      </span>
    </div>
  )
}

/**
 * useDebounce — Hook que retrasa la actualización de un valor
 * Útil para evitar llamadas a la API en cada pulsación de teclado
 * @param {any}  value - Valor a debouncear
 * @param {number} delay - Milisegundos de retardo (default 400ms)
 */
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/**
 * TablaSection — Componente reutilizable de tabla + filtros + estadísticas
 * 
 * Props:
 * @param {Array}  items     - Datos filtrados a mostrar
 * @param {boolean} loading   - Estado de carga
 * @param {string} tipo       - Etiqueta del tipo (materiales/productos/abastecimientos)
 * @param {Array}  columns    - Nombres de las columnas (array de strings)
 * @param {Function} renderRow - Función que renderiza una fila (<td>...</td>)
 * @param {Function} statConfig - Función que calcula las tarjetas de estadísticas
 * @param {Object} filters    - Estado actual de los filtros
 * @param {Function} onFiltersChange - Callback para cambiar los filtros
 * 
 * Los filtros (búsqueda y estado) se envían al backend via useEffect en el padre.
 * Este componente solo muestra los datos que recibe como items.
 */
const TablaSection = ({ items, loading, tipo, columns, renderRow, statConfig, filters, onFiltersChange, statusOptions, pagination, totalItems }) => {
  const [hoveredRow, setHoveredRow] = useState(null)
  const stats = statConfig(items)

  if (loading) {
    return <div className="inv-loading"><i className="ti ti-loader ti-spin" /> Cargando {tipo}...</div>
  }

  return (
    <>
      <div className="inv-stats">
        {stats.map((s, i) => (
          <div className="inv-stat-card" key={i} style={{ '--delay': `${i * 0.08}s` }}>
            <div className={`inv-stat-icon inv-stat-icon--${s.color}`}>
              <i className={s.icon} />
            </div>
            <div>
              <p className={`inv-stat-value ${s.valueRed ? 'inv-stat-value--red' : ''}`}>
                {s.value}<span className="inv-stat-unit">{s.unit}</span>
              </p>
              <p className="inv-stat-label">
                {s.label}
                {s.tag && <span className="inv-stat-tag">{s.tag}</span>}
              </p>
              {s.sub && <p className="inv-stat-sub">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="inv-filters">
        <div className="inv-filters__left">
          {filters.categoryOptions?.length > 0 && (
            <div className="inv-filter-group">
              <i className="ti ti-category" />
              <select className="inv-select" value={filters.category}
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}>
                <option value="">Categoría: Todos</option>
                {filters.categoryOptions?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
          <div className="inv-filter-group">
            <i className="ti ti-filter" />
            <select className="inv-select" value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}>
              <option value="">Estado: Todos</option>
              {(statusOptions || [
                { value: 'disponible', label: 'Disponible' },
                { value: 'agotado', label: 'Agotado' },
                { value: 'eliminado', label: 'Eliminado' },
              ]).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="inv-search">
            <i className="ti ti-search" />
            <input type="text" maxLength={50} placeholder={`Buscar ${tipo}...`}
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
        <p className="inv-filters__count">
          {items.length} {tipo}
        </p>
      </div>

      <div className="inv-table-wrap">
        <table className="inv-table" data-tab={tipo}>
          <thead>
            <tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}
                className={`${item.status === 'agotado' ? 'inv-row--warning' : ''} ${hoveredRow === item.id ? 'inv-row--hover' : ''}`}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {renderRow(item, hoveredRow === item.id)}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="inv-empty-state">
            <i className="ti ti-search-off" />
            <p>No se encontraron {tipo} con esos filtros.</p>
            <button className="inv-empty-btn" onClick={() => onFiltersChange({ ...filters, category: '', status: '', search: '' })}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="inv-pagination">
          <button className="inv-pagination-btn" disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)} title="Anterior">
            <i className="ti ti-chevron-left" />
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`inv-pagination-btn ${p === pagination.page ? 'inv-pagination-btn--active' : ''}`}
              onClick={() => pagination.onPageChange(p)}>
              {p}
            </button>
          ))}
          <button className="inv-pagination-btn" disabled={pagination.page >= pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.page + 1)} title="Siguiente">
            <i className="ti ti-chevron-right" />
          </button>
          {totalItems != null && (
            <span className="inv-pagination-info">{totalItems} total</span>
          )}
        </div>
      )}
    </>
  )
}

// ════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════

/**
 * InventarioPage — Página principal del módulo de inventario
 * @param {string} tipo - Pestaña activa: 'materiales' | 'productos' | 'abastecimiento'
 * 
 * Flujo de datos:
 * 1. Carga inicial via useEffect → loadMateriales() / loadProductos()
 * 2. Filtros cambian → useEffect detecta cambios debounced → recarga con parámetros
 * 3. CRUD (crear/editar/eliminar) → handlers llaman a la API → recargan lista
 */
const InventarioPage = ({ tipo: activeTab = 'materiales' }) => {
  const titulo =
    activeTab === 'materiales' ? 'Inventario | Materiales' :
    activeTab === 'productos' ? 'Inventario | Productos' :
    activeTab === 'abastecimiento' ? 'Inventario | Abastecimiento' :
    activeTab === 'movimientos' ? 'Inventario | Movimientos' :
    'Inventario'
  useDocumentTitle(titulo)

  const [materials, setMaterials] = useState([])
  const [products, setProducts] = useState([])
  const [loadingMat, setLoadingMat] = useState(false)
  const [loadingProd, setLoadingProd] = useState(false)
  const [showDrawerMat, setShowDrawerMat] = useState(false)
  const [showDrawerProd, setShowDrawerProd] = useState(false)
  const [showDrawerAbs, setShowDrawerAbs] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [alertState, setAlertState] = useState(null)

  const {
    abastecimientos,
    proveedores,
    loading: absLoading,
    addAbastecimiento,
    completar: completarAbs,
    cancelar: cancelarAbs,
  } = useAbastecimiento()

  const [matResumen, setMatResumen] = useState(null)
  const [matFilters, setMatFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [matPage, setMatPage] = useState(1)
  const [matTotalPages, setMatTotalPages] = useState(1)
  const [matTotal, setMatTotal] = useState(0)
  const [prodResumen, setProdResumen] = useState(null)
  const [prodFilters, setProdFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [prodPage, setProdPage] = useState(1)
  const [prodTotalPages, setProdTotalPages] = useState(1)
  const [prodTotal, setProdTotal] = useState(0)
  const [absFilters, setAbsFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [selectedAbs, setSelectedAbs] = useState(null)

  // Filtro cliente-side para abastecimientos (por estado y búsqueda)
  const filteredAbastecimientos = useMemo(() => {
    let items = abastecimientos
    if (absFilters.status) {
      items = items.filter((a) => a.estado === absFilters.status)
    }
    if (absFilters.search) {
      const q = absFilters.search.toLowerCase()
      items = items.filter(
        (a) =>
          a.proveedorNombre?.toLowerCase().includes(q) ||
          a.observacion?.toLowerCase().includes(q) ||
          String(a.id).includes(q)
      )
    }
    return items
  }, [abastecimientos, absFilters.status, absFilters.search])

  /** Carga la lista de materiales desde el backend, aplicando filtros opcionales */
  const loadMateriales = useCallback(async (filtros = {}, pagina = 1) => {
    setLoadingMat(true)
    try {
      const params = { limite: 15, pagina, ...filtros }
      const res = await getMateriales(params)
      const items = Array.isArray(res?.data) ? res.data.map(mapperMaterial) : []
      setMaterials(items)
      setMatPage(pagina)
      if (res?.resumen) setMatResumen(res.resumen)
      if (res?.paginacion) {
        setMatTotalPages(res.paginacion.totalPaginas || 1)
        setMatTotal(res.paginacion.total || items.length)
      } else {
        setMatTotalPages(1)
        setMatTotal(items.length)
      }
    } catch (err) {
      console.warn('Error al cargar materiales:', err)
      setMaterials([])
    } finally {
      setLoadingMat(false)
    }
  }, [])

  /** Carga la lista de productos desde el backend, aplicando filtros opcionales */
  const loadProductos = useCallback(async (filtros = {}, pagina = 1) => {
    setLoadingProd(true)
    try {
      const params = { limite: 15, pagina, ...filtros }
      const res = await getProductos(params)
      const items = Array.isArray(res?.data) ? res.data.map(mapperProducto) : []
      setProducts(items)
      setProdPage(pagina)
      if (res?.resumen) setProdResumen(res.resumen)
      if (res?.paginacion) {
        setProdTotalPages(res.paginacion.totalPaginas || 1)
        setProdTotal(res.paginacion.total || items.length)
      } else {
        setProdTotalPages(1)
        setProdTotal(items.length)
      }
    } catch (err) {
      console.warn('Error al cargar productos:', err)
      setProducts([])
    } finally {
      setLoadingProd(false)
    }
  }, [])

  // Debounce para búsqueda (evita llamadas API en cada tecla)
  const debouncedMatSearch = useDebounce(matFilters.search, 500)
  const debouncedProdSearch = useDebounce(prodFilters.search, 500)

  /** Mapea el valor del filtro al string que espera el backend de materiales (DISPONIBLE, AGOTADO, ELIMINADO) */
  const mapEstadoMaterial = (statusFilter) => {
    if (statusFilter === 'disponible') return 'DISPONIBLE'
    if (statusFilter === 'agotado') return 'AGOTADO'
    if (statusFilter === 'eliminado') return 'ELIMINADO'
    return null
  }

  /** Mapea el valor del filtro al número que espera el backend de productos (1=activo, 2=agotado, 3=inactivo) */
  const mapEstadoProducto = (statusFilter) => {
    if (statusFilter === 'disponible') return 1
    if (statusFilter === 'agotado') return 2
    if (statusFilter === 'eliminado') return 3
    return null
  }

  // Recargar materiales al cambiar filtros (búsqueda debounced, estado/categoría inmediato)
  useEffect(() => {
    const params = {}
    if (debouncedMatSearch) params.nombre = debouncedMatSearch
    const estado = mapEstadoMaterial(matFilters.status)
    if (estado != null) params.estado = estado
    if (matFilters.category) params.tipoMaterial = matFilters.category
    loadMateriales(params, 1)
  }, [loadMateriales, debouncedMatSearch, matFilters.status, matFilters.category])

  const handleMatPageChange = (page) => {
    const params = {}
    if (matFilters.search) params.nombre = matFilters.search
    const estado = mapEstadoMaterial(matFilters.status)
    if (estado != null) params.estado = estado
    if (matFilters.category) params.tipoMaterial = matFilters.category
    loadMateriales(params, page)
  }

  // Recargar productos al cambiar filtros
  useEffect(() => {
    const params = {}
    if (debouncedProdSearch) params.nombre = debouncedProdSearch
    const estado = mapEstadoProducto(prodFilters.status)
    if (estado != null) params.estado = estado
    if (prodFilters.category) params.categoria = prodFilters.category
    loadProductos(params, 1)
  }, [loadProductos, debouncedProdSearch, prodFilters.status, prodFilters.category])

  const handleProdPageChange = (page) => {
    const params = {}
    if (prodFilters.search) params.nombre = prodFilters.search
    const estado = mapEstadoProducto(prodFilters.status)
    if (estado != null) params.estado = estado
    if (prodFilters.category) params.categoria = prodFilters.category
    loadProductos(params, page)
  }

  // Abrir formulario de abastecimiento si se navegó con openForm:true (ej: desde acceso rápido del dashboard)
  const location = useLocation()
  const openFormHandled = useRef(false)
  useEffect(() => {
    if (location.state?.openForm && activeTab === 'abastecimiento' && !openFormHandled.current) {
      openFormHandled.current = true
      setShowDrawerAbs(true)
      window.history.replaceState(null, '')
    }
  }, [location.state, activeTab])

  /* ── Handlers Materiales ── */
  /** Abre el drawer para crear un nuevo material */
  const handleAddMaterial = () => { setEditingMaterial(null); setShowDrawerMat(true) }
  const handleEditMaterial = (item) => { setEditingMaterial(item); setShowDrawerMat(true) }

  const handleDeleteMaterial = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Desactivar material',
      message: `¿Desactivar "${item.name}"?`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await changeMaterialEstado(item.id, 'ELIMINADO')
          await loadMateriales()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }

  const handleSaveMaterial = async (data) => {
    try {
      if (data.id) {
        await updateMaterial(data.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          umbralMinimo: data.umbralMinimo ?? 0,
          stock: data.stock,
          unidadMedida: data.unidadMedida,
          tipoMaterial: data.tipoMaterial,
        })
      } else {
        await createMaterial({
          nombre: data.nombre,
          descripcion: data.descripcion,
          umbralMinimo: data.umbralMinimo ?? 0,
          cantidadDisponible: data.cantidadDisponible ?? 0,
          unidadMedida: data.unidadMedida,
          tipoMaterial: data.tipoMaterial,
        })
      }
      setShowDrawerMat(false)
      setEditingMaterial(null)
      await loadMateriales()
      setAlertState({ type: 'success', title: 'Éxito', message: 'Material guardado correctamente', onClose: () => setAlertState(null) })
    } catch (err) {
      const detail = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('. ')
        : ''
      const msg = detail
        ? `${err?.response?.data?.message || 'Error de validación'}: ${detail}`
        : err?.response?.data?.message || err?.message
      setAlertState({ type: 'error', title: 'Error al guardar', message: msg, onClose: () => setAlertState(null) })
    }
  }

  /* ── Handlers Productos ── */
  /** Abre el drawer para crear un nuevo producto */
  const handleAddProduct = () => { setEditingProduct(null); setShowDrawerProd(true) }
  const handleEditProduct = (item) => { setEditingProduct(item); setShowDrawerProd(true) }

  const handleDeleteProduct = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Desactivar producto',
      message: `¿Desactivar "${item.name}"?`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await changeProductoEstado(item.id, 3)
          await loadProductos()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }

  const handleSaveProduct = async (data) => {
    try {
      if (data.id) {
        await updateProducto(data.id, {
          nombre: data.nombre,
          precioUnitario: data.precio || 0,
          genero: data.genero,
          tipoPrenda: data.tipoPrenda,
          categoriaId: data.categoriaId,
          talla: data.talla,
          umbralMinimo: data.umbralMinimo ?? 0,
          tipoProducto: 'INVENTARIO',
        })
      } else {
        await createProducto({
          nombre: data.nombre,
          precioUnitario: data.precio || 0,
          genero: data.genero,
          tipoPrenda: data.tipoPrenda,
          categoriaId: data.categoriaId,
          talla: data.talla,
          cantidadDisponible: data.cantidadDisponible ?? 0,
          umbralMinimo: data.umbralMinimo ?? 0,
          tipoProducto: 'INVENTARIO',
        })
      }
      setShowDrawerProd(false)
      setEditingProduct(null)
      await loadProductos()
      setAlertState({ type: 'success', title: 'Éxito', message: 'Producto guardado correctamente', onClose: () => setAlertState(null) })
    } catch (err) {
      const detail = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('. ')
        : ''
      const msg = detail
        ? `${err?.response?.data?.message || 'Error de validación'}: ${detail}`
        : err?.response?.data?.message || err?.message
      setAlertState({ type: 'error', title: 'Error al guardar', message: msg, onClose: () => setAlertState(null) })
    }
  }

  /* ── Handlers Abastecimiento ── */
  /** Abre el drawer para crear un nuevo abastecimiento */
  const handleAddAbastecimiento = () => setShowDrawerAbs(true)
  const handleSaveAbastecimiento = async (data) => {
    try {
      await addAbastecimiento(data)
      setShowDrawerAbs(false)
      const itemsMsg = data.detalles?.length
        ? 'Ítems: ' + data.detalles.map((d) => `${d.detAbsRefNombre || `Ref #${d.detAbsRefId}`} (×${d.detAbsCant})`).join(', ')
        : ''
      setAlertState({ type: 'success', title: 'Éxito', message: `Abastecimiento registrado correctamente.\n${itemsMsg}`, onClose: () => setAlertState(null) })
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error desconocido'
      setAlertState({ type: 'error', title: 'Error al registrar', message: msg, onClose: () => setAlertState(null) })
    }
  }
  const handleCompletarAbastecimiento = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Completar abastecimiento',
      message: `¿Completar el abastecimiento #${item.id}?\n\nEsto actualizará el stock de los ítems.`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await completarAbs(item.id)

          // Actualizar stock de productos manualmente (el backend solo actualiza materiales)
          const detallesProducto = (item.detalles || []).filter(
            (d) => d.tipo === 'PRODUCTO' && d.refId
          )
          if (detallesProducto.length > 0) {
            await Promise.all(
              detallesProducto.map(async (d) => {
                try {
                  const apiRes = await getProductoById(d.refId)
                  const prod = apiRes?.data || apiRes
                  if (!prod || !prod.id) return
                  const stockActual = Number(prod.cantidadDisponible || 0)
                  await updateProducto(prod.id, {
                    nombre: prod.nombre,
                    precioUnitario: prod.precioUnitario || 0,
                    genero: prod.genero || null,
                    tipoPrenda: prod.tipoPrenda || null,
                    categoriaId: prod.categoriaId || null,
                    talla: prod.talla || null,
                    cantidadDisponible: stockActual + d.cantidad,
                    umbralMinimo: prod.umbralMinimo ?? 0,
                    tipoProducto: prod.tipoProducto || 'INVENTARIO',
                  })
                } catch (err) {
                  console.warn(`Error al actualizar stock del producto #${d.refId}:`, err)
                }
              })
            )
          }

          await loadMateriales()
          await loadProductos()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }
  const handleCancelarAbastecimiento = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Cancelar abastecimiento',
      message: `¿Cancelar el abastecimiento #${item.id}?`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await cancelarAbs(item.id)
          await loadMateriales()
          await loadProductos()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }

  /* ════ Configuración de la tabla de Materiales ════ */
  const matStats = (items) => {
    // Usar resumen global del backend SIEMPRE que esté disponible (bug #5)
    if (matResumen) {
      const s = matResumen.total_stock
      return [
        { color: 'blue', icon: 'ti ti-stack', value: s.total.toLocaleString('es-CO'), unit: ' mts', label: 'Stock Total', sub: `${s.materiales_registrados} materiales registrados` },
        { color: 'red', icon: 'ti ti-alert-triangle', value: matResumen.alertas_stock, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
        { color: 'green', icon: 'ti ti-package', value: s.materiales_registrados, unit: '', label: 'Materiales Registrados', sub: 'total en catálogo' },
      ]
    }
    // Fallback: si el backend no envió resumen, calcular desde items (filtrados)
    const totalStock = items.reduce((s, m) => s + m.stock, 0)
    const lowCount = items.filter((m) => m.status === 'agotado').length
    return [
      { color: 'blue', icon: 'ti ti-stack', value: totalStock.toLocaleString('es-CO'), unit: ' mts', label: 'Stock Total', sub: `${items.length} materiales registrados` },
      { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
      { color: 'green', icon: 'ti ti-package', value: items.length, unit: '', label: 'Materiales Registrados', sub: 'total en catálogo' },
    ]
  }

  const matRenderRow = (m, hovered) => (
    <>
      <td>
        <div className="inv-cell-name">
          <p className="inv-material-name">{m.name}</p>
          <p className="inv-material-ref">{m.ref}</p>
        </div>
      </td>
      <td><span className="inv-cat-tag">{m.tipo_material || '—'}</span></td>
      <td className="inv-cell-specs">{m.unidad_medida || '—'}</td>
      <td className="inv-cell-specs">{m.desc || '—'}</td>
      <td><StockBar current={m.stock} min={m.minStock} /></td>
      <td>
        <span className={`inv-badge ${m.status === 'agotado' ? 'inv-badge--empty' : m.status === 'eliminado' ? 'inv-badge--empty' : 'inv-badge--ok'}`}>
          <i className={`ti ti-${m.status === 'disponible' ? 'circle-check' : 'x-circle'}`} />
          {m.status === 'disponible' ? 'Disponible' : m.status === 'agotado' ? 'Agotado' : 'Eliminado'}
        </span>
      </td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Editar" onClick={() => handleEditMaterial(m)}><i className="ti ti-edit" /></button>
          {m.status !== 'eliminado' && (
            <button className="inv-action-btn inv-action-btn--danger" title="Desactivar" onClick={() => handleDeleteMaterial(m)}><i className="ti ti-trash" /></button>
          )}
        </div>
      </td>
    </>
  )

  const matColumns = ['MATERIAL', 'TIPO', 'UNIDAD', 'DESCRIPCIÓN', 'STOCK', 'ESTADO', '']

  /* ════ Configuración de la tabla de Productos ════ */
  const prodStats = (items) => {
    // Usar resumen global del backend SIEMPRE que esté disponible
    if (prodResumen) {
      return [
        { color: 'blue', icon: 'ti ti-hanger', value: prodResumen.total_productos, unit: '', label: 'Total Productos', sub: 'en catálogo' },
        { color: 'red', icon: 'ti ti-alert-triangle', value: prodResumen.alertas_stock, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
        { color: 'green', icon: 'ti ti-coin', value: fmt(prodResumen.valor_total), unit: '', label: 'Valor del Catálogo', sub: 'precio de venta total' },
      ]
    }
    const totalVal = items.reduce((s, p) => s + p.price * p.stock, 0)
    const lowCount = items.filter((p) => p.status === 'agotado').length
    return [
      { color: 'blue', icon: 'ti ti-hanger', value: items.length, unit: '', label: 'Total Productos', sub: 'en catálogo' },
      { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
      { color: 'green', icon: 'ti ti-coin', value: fmt(totalVal), unit: '', label: 'Valor del Catálogo', sub: 'precio de venta total' },
    ]
  }

  const prodRenderRow = (p, hovered) => (
    <>
      <td>
        <div className="inv-cell-name">
          <p className="inv-material-name">{p.name}</p>
          <p className="inv-material-ref">{p.ref}</p>
        </div>
      </td>
      <td className="inv-cell-specs">{p.descripcion || '—'}</td>
      <td><span className="inv-cat-tag">{p.categoria || '—'}</span></td>
      <td><span className="inv-cat-tag">{p.tipo_prenda || '—'}</span></td>
      <td className="inv-cell-specs">{p.genero} · {p.talla}</td>
      <td className="inv-cell-price">{fmt(p.price)}</td>
      <td><StockBar current={p.stock} min={p.minStock} /></td>
      <td>
        <span className={`inv-badge ${p.status === 'agotado' ? 'inv-badge--empty' : p.status === 'eliminado' ? 'inv-badge--empty' : 'inv-badge--ok'}`}>
          <i className={`ti ti-${p.status === 'disponible' ? 'circle-check' : 'x-circle'}`} />
          {p.status === 'disponible' ? 'Disponible' : p.status === 'agotado' ? 'Agotado' : 'Eliminado'}
        </span>
      </td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Editar" onClick={() => handleEditProduct(p)}><i className="ti ti-edit" /></button>
          {p.status !== 'eliminado' && (
            <button className="inv-action-btn inv-action-btn--danger" title="Desactivar" onClick={() => handleDeleteProduct(p)}><i className="ti ti-trash" /></button>
          )}
        </div>
      </td>
    </>
  )

  const prodColumns = ['PRODUCTO', 'DESCRIPCIÓN', 'CATEGORÍA', 'TIPO PRENDA', 'GÉNERO · TALLA', 'PRECIO', 'STOCK', 'ESTADO', '']

  /* ════ Configuración de la tabla de Abastecimientos ════ */

  // Mapa de IDs → nombres para resolver referencias en abastecimientos
  const refNameMap = useMemo(() => {
    const map = {}
    materials.forEach((m) => { map[String(m.id)] = m.name })
    products.forEach((p) => { map[String(p.id)] = p.name })
    return map
  }, [materials, products])

  /** Resuelve el nombre de un detalle, usando el mapa de referencias si no tiene nombre */
  const resolverNombreDetalle = (d) => {
    if (d.nombre && !d.nombre.startsWith('Ref #')) return d.nombre
    const refId = String(d.nombre || '').replace('Ref #', '')
    return refNameMap[refId] || d.nombre || '—'
  }

  /** Formatea un número como moneda COP para abastecimientos */
  const fmtAbs = (val) => Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  const absStats = (items) => {
    const pendientes = items.filter((a) => a.estado === 'PENDIENTE').length
    const completados = items.filter((a) => a.estado === 'COMPLETADO').length
    const costoTotal = items.reduce((s, a) => s + (a.costoTotal || 0), 0)
    return [
      { color: 'blue', icon: 'ti ti-truck', value: items.length, unit: '', label: 'Total Abastecimientos', sub: 'registros en el sistema' },
      { color: 'red', icon: 'ti ti-clock', value: pendientes, unit: '', label: 'Pendientes', valueRed: true, sub: 'aún sin procesar' },
      { color: 'green', icon: 'ti ti-circle-check', value: completados, unit: '', label: 'Completados', sub: 'stock actualizado' },
      { color: 'gold', icon: 'ti ti-coin', value: fmtAbs(costoTotal), unit: '', label: 'Costo Total', sub: 'de abastecimientos completados' },
    ]
  }

  const absRenderRow = (a, hovered) => {
    const fecha = a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    const estadoClass = a.estado === 'COMPLETADO' ? 'inv-badge--ok' : a.estado === 'CANCELADO' ? 'inv-badge--empty' : 'inv-badge--warn'
    const estadoLabel = a.estado === 'COMPLETADO' ? 'Completado' : a.estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente'
    // Resumen de ítems para mostrar en la tabla (incluye costo unitario)
    const itemsResumen = a.detalles?.length > 0
      ? a.detalles.map((d) => `${resolverNombreDetalle(d)} (×${d.cantidad} · ${fmtAbs(d.costo)} c/u)`).join(', ')
      : (a.observacion || `${a.totalItems} ítem(s)`)

    return (
      <>
        <td>
          <div className="inv-cell-name">
            <p className="inv-material-name">#{a.id} — {a.proveedorNombre}</p>
            <p className="inv-material-ref">{fecha}</p>
          </div>
        </td>
        <td className="inv-cell-specs" title={itemsResumen}>{itemsResumen}</td>
        <td><span className={`inv-badge ${estadoClass}`}><i className={`ti ti-${a.estado === 'COMPLETADO' ? 'circle-check' : a.estado === 'CANCELADO' ? 'x-circle' : 'clock'}`} />{estadoLabel}</span></td>
        <td className="inv-cell-price">{fmtAbs(a.costoTotal)}</td>
        <td>
          <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
            <button className="inv-action-btn" title="Ver detalle" onClick={() => setSelectedAbs(a)}><i className="ti ti-eye" /></button>
            {a.estado === 'PENDIENTE' && (
              <>
                <button className="inv-action-btn inv-action-btn--success" title="Completar" onClick={() => handleCompletarAbastecimiento(a)}><i className="ti ti-circle-check" /></button>
                <button className="inv-action-btn inv-action-btn--danger" title="Cancelar" onClick={() => handleCancelarAbastecimiento(a)}><i className="ti ti-trash" /></button>
              </>
            )}
          </div>
        </td>
      </>
    )
  }

  const absColumns = ['ABASTECIMIENTO', 'ÍTEMS', 'ESTADO', 'COSTO TOTAL', '']

  const handleAddBtn = () => {
    if (activeTab === 'materiales') handleAddMaterial()
    else if (activeTab === 'productos') handleAddProduct()
    else if (activeTab === 'abastecimiento') handleAddAbastecimiento()
    // Movimientos no tiene acción de crear
  }

  return (
    <div className="inv-content">
      <div className="inv-header">
        <div className="inv-header-left">
          <div className="inv-header-icon"><i className="ti ti-package" /></div>
          <div>
            <h1 className="inv-title">Inventario</h1>
            <p className="inv-subtitle">Controla tus materiales textiles y productos confeccionados en un solo lugar.</p>
          </div>
        </div>
        {activeTab !== 'movimientos' && (
          <button className="inv-btn-primary" onClick={handleAddBtn}>
            <i className="ti ti-plus" />
            {activeTab === 'materiales' ? 'Añadir Material' : activeTab === 'productos' ? 'Nuevo Producto' : 'Nuevo Abastecimiento'}
          </button>
        )}
      </div>

      {activeTab === 'materiales' && (
        <TablaSection items={materials} loading={loadingMat} tipo="materiales" columns={matColumns} renderRow={matRenderRow} statConfig={matStats} filters={matFilters} onFiltersChange={setMatFilters}
          pagination={{ page: matPage, totalPages: matTotalPages, onPageChange: handleMatPageChange }}
          totalItems={matTotal}
        />
      )}
      {activeTab === 'productos' && (
        <TablaSection items={products} loading={loadingProd} tipo="productos" columns={prodColumns} renderRow={prodRenderRow} statConfig={prodStats} filters={prodFilters} onFiltersChange={setProdFilters}
          pagination={{ page: prodPage, totalPages: prodTotalPages, onPageChange: handleProdPageChange }}
          totalItems={prodTotal}
        />
      )}
      {activeTab === 'abastecimiento' && (
        <TablaSection items={filteredAbastecimientos} loading={absLoading} tipo="abastecimientos" columns={absColumns} renderRow={absRenderRow} statConfig={absStats} filters={absFilters} onFiltersChange={setAbsFilters}
          statusOptions={[
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'COMPLETADO', label: 'Completado' },
            { value: 'CANCELADO', label: 'Cancelado' },
          ]}
        />
      )}
      {activeTab === 'movimientos' && <MovimientosPage />}

      {showDrawerMat && (
        <RegisterMaterial
          isOpen={showDrawerMat}
          onClose={() => { setShowDrawerMat(false); setEditingMaterial(null) }}
          initialData={editingMaterial}
          existingMaterials={materials}
          onSave={handleSaveMaterial}
        />
      )}
      {showDrawerProd && (
        <RegisterProducto
          isOpen={showDrawerProd}
          onClose={() => { setShowDrawerProd(false); setEditingProduct(null) }}
          initialData={editingProduct}
          onSave={handleSaveProduct}
        />
      )}
      {showDrawerAbs && (
        <RegisterAbastecimiento
          isOpen={showDrawerAbs}
          onClose={() => setShowDrawerAbs(false)}
          proveedores={proveedores}
          onSave={handleSaveAbastecimiento}
        />
      )}

      {/* ── Modal detalle de abastecimiento (portal) ── */}
      {selectedAbs && (() => {
        const estado = selectedAbs.estado || 'PENDIENTE'
        const estadoLabel = estado === 'COMPLETADO' ? 'Completado' : estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente'
        const estadoIcon = estado === 'COMPLETADO' ? 'ti ti-circle-check-filled' : estado === 'CANCELADO' ? 'ti ti-x-circle-filled' : 'ti ti-clock-filled'
        const estadoColor = estado === 'COMPLETADO' ? '#10b981' : estado === 'CANCELADO' ? '#6b7280' : '#f59e0b'
        const totalItems = (selectedAbs.detalles || []).length
        const fecha = selectedAbs.fecha
          ? new Date(selectedAbs.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
          : '—'
        return createPortal(
          <div className="abs-overlay" onClick={() => setSelectedAbs(null)}>
            <div className="abs-detail-modal" onClick={(e) => e.stopPropagation()}>
              {/* ── Header con estado ── */}
              <div className="abs-detail-topbar" style={{ background: estadoColor }}>
                <div className="abs-detail-topbar-left">
                  <i className={estadoIcon} />
                  <div>
                    <p className="abs-detail-id">Abastecimiento #{selectedAbs.id}</p>
                    <p className="abs-detail-status">{estadoLabel}</p>
                  </div>
                </div>
                <button className="abs-detail-close" onClick={() => setSelectedAbs(null)}>
                  <i className="ti ti-x" />
                </button>
              </div>

              <div className="abs-detail-body">
                {/* ── Resumen del proveedor ── */}
                <div className="abs-info-grid">
                  <div className="abs-info-card">
                    <i className="ti ti-building-store" />
                    <span className="abs-info-label">Proveedor</span>
                    <span className="abs-info-value">{selectedAbs.proveedorNombre || '—'}</span>
                  </div>
                  <div className="abs-info-card">
                    <i className="ti ti-calendar" />
                    <span className="abs-info-label">Fecha</span>
                    <span className="abs-info-value">{fecha}</span>
                  </div>
                  <div className="abs-info-card">
                    <i className="ti ti-box" />
                    <span className="abs-info-label">Ítems</span>
                    <span className="abs-info-value">{totalItems} producto(s)</span>
                  </div>
                  <div className="abs-info-card">
                    <i className="ti ti-coin" />
                    <span className="abs-info-label">Total</span>
                    <span className="abs-info-value abs-total-highlight">{fmtAbs(selectedAbs.costoTotal)}</span>
                  </div>
                </div>

                {/* ── Observación ── */}
                {selectedAbs.observacion && (
                  <div className="abs-obs-section">
                    <i className="ti ti-notes" />
                    <p>{selectedAbs.observacion}</p>
                  </div>
                )}

                {/* ── Tabla de ítems ── */}
                <div className="abs-items-section">
                  <h4 className="abs-items-title">
                    <i className="ti ti-list-details" />
                    Productos / Materiales
                  </h4>
                  <div className="abs-table-wrap">
                    <table className="abs-detail-table">
                      <thead>
                        <tr>
                          <th>Producto/Material</th>
                          <th className="abs-th-num">Cantidad</th>
                          <th className="abs-th-num">Costo unit.</th>
                          <th className="abs-th-num">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedAbs.detalles || []).map((d, i) => (
                          <tr key={i}>
                            <td>
                              <span className="abs-item-name">{resolverNombreDetalle(d)}</span>
                            </td>
                            <td className="abs-td-num">{d.cantidad}</td>
                            <td className="abs-td-num">{fmtAbs(d.costo)}</td>
                            <td className="abs-td-num abs-td-total">{fmtAbs(d.cantidad * d.costo)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="abs-foot-label">Total general</td>
                          <td className="abs-foot-value">{fmtAbs(selectedAbs.costoTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      })()}

      {alertState && (
        <Alert
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={alertState.onConfirm}
          onCancel={alertState.onCancel}
          onClose={alertState.onClose}
        />
      )}
    </div>
  )
}

export default InventarioPage
