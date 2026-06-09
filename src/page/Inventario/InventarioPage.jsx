import { useState, useRef, useCallback } from 'react'
import RegisterMaterial from './RegisterMaterial'
import RegisterProducto from './RegisterProducto'
import RegisterAbastecimiento from './RegisterAbastecimiento'
import { useAbastecimiento } from '../../hooks/useAbastecimiento'
import './InventarioPage.css'

// ── Datos iniciales ─────────────────────────
const INITIAL_MATERIALS = [
  { id: 1, name: 'Seda Natural China', ref: 'SNC-001', tipo_material: 'Tela', unidad_medida: 'mts', desc: '5.5 mm, 12 mm, 120 g/m²', stock: 340, minStock: 50, status: 'disponible' },
  { id: 2, name: 'Lino Belga Crudo', ref: 'LBC-004', tipo_material: 'Tela', unidad_medida: 'mts', desc: '220 g/m², 150 cm ancho', stock: 12, minStock: 30, status: 'disponible' },
  { id: 3, name: 'Terciopelo de Seda Italiano', ref: 'TSI-009', tipo_material: 'Tela', unidad_medida: 'mts', desc: '320 g/m², 140 cm ancho', stock: 0, minStock: 20, status: 'agotado' },
  { id: 4, name: 'Tinte Natural Índigo', ref: 'TNI-012', tipo_material: 'Tinte', unidad_medida: 'kg', desc: 'Polvo concentrado, 500 g', stock: 89, minStock: 15, status: 'disponible' },
  { id: 5, name: 'Seda Orgánica Tussar', ref: 'SOT-007', tipo_material: 'Tela', unidad_medida: 'mts', desc: '6 mm, 15 mm, 110 g/m²', stock: 28, minStock: 25, status: 'disponible' },
]

const INITIAL_PRODUCTOS = [
  { id: 1, name: 'Vestido de Noche Seda', ref: 'VNS-001', descripcion: 'Vestido largo de seda natural con escote en V', tipo_prenda: 'Vestido', genero: 'Femenino', talla: 'M', price: 320000, stock: 8, minStock: 3, status: 'disponible' },
  { id: 2, name: 'Blazer Lino Clásico', ref: 'BLC-004', descripcion: 'Blazer estructurado en lino 100%', tipo_prenda: 'Blazer', genero: 'Masculino', talla: 'L', price: 245000, stock: 2, minStock: 4, status: 'disponible' },
  { id: 3, name: 'Corbata Terciopelo Italia', ref: 'CTI-009', descripcion: 'Corbata de terciopelo bordada a mano', tipo_prenda: 'Corbata', genero: 'Masculino', talla: 'Única', price: 85000, stock: 0, minStock: 6, status: 'agotado' },
  { id: 4, name: 'Pañuelo Seda Tussar', ref: 'PST-007', descripcion: 'Pañuelo cuadrado de seda Tussar', tipo_prenda: 'Pañuelo', genero: 'Femenino', talla: 'Única', price: 120000, stock: 15, minStock: 5, status: 'disponible' },
  { id: 5, name: 'Vestido de Día Lino', ref: 'VDL-012', descripcion: 'Vestido casual de lino con cinturón', tipo_prenda: 'Vestido', genero: 'Femenino', talla: 'S', price: 195000, stock: 4, minStock: 3, status: 'disponible' },
]

// TABS ahora están en NavTabs del header

const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// ── Mini barra de stock ──────────────────────
const StockBar = ({ current, min }) => {
  const pct = Math.min((current / Math.max(min, 1)) * 100, 100)
  const color =
    current === 0 ? '#e74c3c' :
    current <= min ? '#e67e22' :
    '#2e7d32'
  return (
    <div className="inv-stockbar-track">
      <div className="inv-stockbar-fill" style={{ width: `${pct}%`, background: color }} />
      <span className="inv-stockbar-label" style={{ color }}>
        {current} <small>{current <= min ? '⚠' : ''}</small>
      </span>
    </div>
  )
}

// ── Hook para debounce ────────────────────
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useRef(null)

  useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebounced(value), delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay])()

  return debounced
}

// ── TablaSection ─────────────────────────────
const TablaSection = ({ items, tipo, columns, renderRow, statConfig, filters, onFiltersChange }) => {
  const searchDebounced = useDebounce(filters.search, 300)

  const filtered = items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false
    if (filters.status && item.status !== filters.status) return false
    if (searchDebounced) {
      const q = searchDebounced.toLowerCase()
      const matchName = item.name?.toLowerCase()?.includes(q)
      const matchRef = item.ref?.toLowerCase()?.includes(q)
      if (!matchName && !matchRef) return false
    }
    return true
  })

  const [hoveredRow, setHoveredRow] = useState(null)
  const stats = statConfig(items)

  return (
    <>
      {/* ══ STATS ══ */}
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

      {/* ══ FILTROS ══ */}
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
              <option value="disponible">Disponible</option>
              <option value="agotado">Agotado</option>
              <option value="eliminado">Eliminado</option>
            </select>
          </div>
          <div className="inv-search">
            <i className="ti ti-search" />
            <input type="text" placeholder={`Buscar ${tipo}...`}
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
        <p className="inv-filters__count">
          {filtered.length} de {items.length} {tipo}
        </p>
      </div>

      {/* ══ TABLA ══ */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={`${item.status === 'agotado' ? 'inv-row--warning' : ''} ${hoveredRow === item.id ? 'inv-row--hover' : ''}`}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {renderRow(item, hoveredRow === item.id)}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="inv-empty-state">
            <i className="ti ti-search-off" />
            <p>No se encontraron {tipo} con esos filtros.</p>
            <button className="inv-empty-btn" onClick={() => onFiltersChange({ ...filters, category: '', status: '', search: '' })}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Página principal ─────────────────────────
const InventarioPage = ({ tipo: activeTab = 'materiales' }) => {
  // ── Datos en estado (mutables) ──
  const [materials, setMaterials] = useState(INITIAL_MATERIALS)
  const [products, setProducts] = useState(INITIAL_PRODUCTOS)
  const [nextMatId, setNextMatId] = useState(6)
  const [nextProdId, setNextProdId] = useState(6)

  // ── Drawers ──
  const [showDrawerMat, setShowDrawerMat] = useState(false)
  const [showDrawerProd, setShowDrawerProd] = useState(false)
  const [showDrawerAbs, setShowDrawerAbs] = useState(false)

  // ── Edición ──
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)

  // ── Abastecimiento (hook) ──
  const {
    abastecimientos,
    proveedores,
    meta: absMeta,
    loading: absLoading,
    addAbastecimiento,
    completar: completarAbs,
    cancelar: cancelarAbs,
  } = useAbastecimiento()

  // ── Filtros ──
  const [matFilters, setMatFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [prodFilters, setProdFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [absFilters, setAbsFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })

  // ══ Handlers Materiales ══
  const handleAddMaterial = () => {
    setEditingMaterial(null)
    setShowDrawerMat(true)
  }

  const handleEditMaterial = (item) => {
    setEditingMaterial(item)
    setShowDrawerMat(true)
  }

  const handleDeleteMaterial = (item) => {
    if (!window.confirm(`¿Eliminar "${item.name}"?\n\nEsta acción no se puede deshacer.`)) return
    setMaterials((prev) => prev.filter((m) => m.id !== item.id))
  }

  const handleSaveMaterial = (data) => {
    if (data.id) {
      setMaterials((prev) => prev.map((m) => (m.id === data.id ? data : m)))
    } else {
      const nuevo = { ...data, id: nextMatId }
      setMaterials((prev) => [...prev, nuevo])
      setNextMatId((id) => id + 1)
    }
    setShowDrawerMat(false)
    setEditingMaterial(null)
  }

  // ══ Handlers Abastecimiento ══
  const handleAddAbastecimiento = () => {
    setShowDrawerAbs(true)
  }

  const handleSaveAbastecimiento = async (data) => {
    try {
      await addAbastecimiento(data)
      setShowDrawerAbs(false)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error desconocido'
      alert('Error al registrar abastecimiento: ' + msg)
    }
  }

  const handleCompletarAbastecimiento = async (item) => {
    if (!window.confirm(`¿Completar el abastecimiento #${item.id}?\n\nEsto actualizará el stock de los ítems.`)) return
    try {
      await completarAbs(item.id)
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err?.message))
    }
  }

  const handleCancelarAbastecimiento = async (item) => {
    if (!window.confirm(`¿Cancelar el abastecimiento #${item.id}?\n\nNo se afectará el stock.`)) return
    try {
      await cancelarAbs(item.id)
    } catch (err) {
      alert('Error: ' + (err?.response?.data?.message || err?.message))
    }
  }

  // ══ Handlers Productos ══
  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowDrawerProd(true)
  }

  const handleEditProduct = (item) => {
    setEditingProduct(item)
    setShowDrawerProd(true)
  }

  const handleDeleteProduct = (item) => {
    if (!window.confirm(`¿Eliminar "${item.name}"?\n\nEsta acción no se puede deshacer.`)) return
    setProducts((prev) => prev.filter((p) => p.id !== item.id))
  }

  const handleSaveProduct = (data) => {
    if (data.id) {
      setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)))
    } else {
      const nuevo = { ...data, id: nextProdId }
      setProducts((prev) => [...prev, nuevo])
      setNextProdId((id) => id + 1)
    }
    setShowDrawerProd(false)
    setEditingProduct(null)
  }

  // ── Config Materiales ──
  const matStats = (items) => {
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
      <td className="inv-cell-specs">{m.desc}</td>
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
          <button className="inv-action-btn inv-action-btn--danger" title="Eliminar" onClick={() => handleDeleteMaterial(m)}><i className="ti ti-trash" /></button>
        </div>
      </td>
    </>
  )

  const matColumns = ['MATERIAL', 'TIPO', 'UNIDAD', 'DESCRIPCIÓN', 'STOCK', 'ESTADO', '']

  // ── Config Productos ──
  const prodStats = (items) => {
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
          <button className="inv-action-btn inv-action-btn--danger" title="Eliminar" onClick={() => handleDeleteProduct(p)}><i className="ti ti-trash" /></button>
        </div>
      </td>
    </>
  )

  const prodColumns = ['PRODUCTO', 'DESCRIPCIÓN', 'TIPO PRENDA', 'GÉNERO · TALLA', 'PRECIO', 'STOCK', 'ESTADO', '']

  // ── Config Abastecimiento ──
  const fmtAbs = (val) =>
    Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

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
    const estadoClass =
      a.estado === 'COMPLETADO' ? 'inv-badge--ok' :
      a.estado === 'CANCELADO' ? 'inv-badge--empty' :
      'inv-badge--warn'
    const estadoLabel =
      a.estado === 'COMPLETADO' ? 'Completado' :
      a.estado === 'CANCELADO' ? 'Cancelado' :
      'Pendiente'
    return (
      <>
        <td>
          <div className="inv-cell-name">
            <p className="inv-material-name">#{a.id} — {a.proveedorNombre}</p>
            <p className="inv-material-ref">{fecha} · {a.totalItems} ítems</p>
          </div>
        </td>
        <td>
          <span className={`inv-badge ${estadoClass}`}>
            <i className={`ti ti-${a.estado === 'COMPLETADO' ? 'circle-check' : a.estado === 'CANCELADO' ? 'x-circle' : 'clock'}`} />
            {estadoLabel}
          </span>
        </td>
        <td className="inv-cell-price">{fmtAbs(a.costoTotal)}</td>
        <td className="inv-cell-specs">{a.observacion || '—'}</td>
        <td>
          <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
            {a.estado === 'PENDIENTE' && (
              <>
                <button className="inv-action-btn inv-action-btn--success" title="Completar" onClick={() => handleCompletarAbastecimiento(a)}>
                  <i className="ti ti-circle-check" />
                </button>
                <button className="inv-action-btn inv-action-btn--danger" title="Cancelar" onClick={() => handleCancelarAbastecimiento(a)}>
                  <i className="ti ti-x-circle" />
                </button>
              </>
            )}
          </div>
        </td>
      </>
    )
  }

  const absColumns = ['ABASTECIMIENTO', 'ESTADO', 'COSTO TOTAL', 'OBSERVACIÓN', '']

  return (
    <div className="inv-content">

      {/* ══ HEADER ══ */}
      <div className="inv-header">
        <div className="inv-header-left">
          <div className="inv-header-icon">
            <i className="ti ti-package" />
          </div>
          <div>
            <h1 className="inv-title">Inventario</h1>
            <p className="inv-subtitle">
              Controla tus materiales textiles y productos confeccionados en un solo lugar.
            </p>
          </div>
        </div>
        <button className="inv-btn-primary" onClick={() => activeTab === 'materiales' ? handleAddMaterial() : activeTab === 'productos' ? handleAddProduct() : handleAddAbastecimiento()}>
          <i className="ti ti-plus" />
          {activeTab === 'materiales' ? 'Añadir Material' : activeTab === 'productos' ? 'Nuevo Producto' : 'Nuevo Abastecimiento'}
        </button>
      </div>

      {/* ══ TABS en NavHeader (arriba) — los links están en la barra del header */}

      {/* ══ CONTENIDO ══ */}
      {activeTab === 'materiales' && (
        <TablaSection items={materials} tipo="materiales" columns={matColumns} renderRow={matRenderRow} statConfig={matStats} filters={matFilters} onFiltersChange={setMatFilters} />
      )}
      {activeTab === 'productos' && (
        <TablaSection items={products} tipo="productos" columns={prodColumns} renderRow={prodRenderRow} statConfig={prodStats} filters={prodFilters} onFiltersChange={setProdFilters} />
      )}
      {activeTab === 'abastecimiento' && (
        <TablaSection items={abastecimientos} tipo="abastecimientos" columns={absColumns} renderRow={absRenderRow} statConfig={absStats} filters={absFilters} onFiltersChange={setAbsFilters} />
      )}

      {/* ══ DRAWERS ══ */}
      {showDrawerMat && (
        <RegisterMaterial
          isOpen={showDrawerMat}
          onClose={() => { setShowDrawerMat(false); setEditingMaterial(null) }}
          initialData={editingMaterial}
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
    </div>
  )
}

export default InventarioPage
