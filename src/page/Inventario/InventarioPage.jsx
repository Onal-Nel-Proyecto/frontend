import { useState } from 'react'
import RegisterMaterial from './RegisterMaterial'
import RegisterProducto from './RegisterProducto'
import './InventarioPage.css'

// ── Datos hardcodeados ─────────────────────────
const MATERIALS = [
  { id: 1, name: 'Seda Natural China', ref: 'SNC-001', category: 'Telas de Seda', specs: '5.5 mm, 12 mm, 120 g/m²', price: 24500, stock: 340, minStock: 50, status: 'In Stock' },
  { id: 2, name: 'Lino Belga Crudo', ref: 'LBC-004', category: 'Linos', specs: '220 g/m², 150 cm ancho', price: 18000, stock: 12, minStock: 30, status: 'Low Stock' },
  { id: 3, name: 'Terciopelo de Seda Italiano', ref: 'TSI-009', category: 'Terciopelos', specs: '320 g/m², 140 cm ancho', price: 38000, stock: 0, minStock: 20, status: 'Sin Stock' },
  { id: 4, name: 'Tinte Natural Índigo', ref: 'TNI-012', category: 'Tintes y Acabados', specs: 'Polvo concentrado, 500 g', price: 12750, stock: 89, minStock: 15, status: 'In Stock' },
  { id: 5, name: 'Seda Orgánica Tussar', ref: 'SOT-007', category: 'Telas de Seda', specs: '6 mm, 15 mm, 110 g/m²', price: 29000, stock: 28, minStock: 25, status: 'Low Stock' },
]

const PRODUCTOS = [
  { id: 1, name: 'Vestido de Noche Seda', ref: 'VNS-001', category: 'Vestidos', material: 'Seda Natural China', price: 320000, stock: 8, minStock: 3, status: 'In Stock' },
  { id: 2, name: 'Blazer Lino Clásico', ref: 'BLC-004', category: 'Chaquetas', material: 'Lino Belga Crudo', price: 245000, stock: 2, minStock: 4, status: 'Low Stock' },
  { id: 3, name: 'Corbata Terciopelo Italia', ref: 'CTI-009', category: 'Accesorios', material: 'Terciopelo de Seda Italiano', price: 85000, stock: 0, minStock: 6, status: 'Sin Stock' },
  { id: 4, name: 'Pañuelo Seda Tussar', ref: 'PST-007', category: 'Accesorios', material: 'Seda Orgánica Tussar', price: 120000, stock: 15, minStock: 5, status: 'In Stock' },
  { id: 5, name: 'Vestido de Día Lino', ref: 'VDL-012', category: 'Vestidos', material: 'Lino Belga Crudo', price: 195000, stock: 4, minStock: 3, status: 'Low Stock' },
]

const TABS = [
  { id: 'materiales', label: 'Materiales', icon: 'ti-rollers' },
  { id: 'productos', label: 'Productos', icon: 'ti-hanger' },
]

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

// ── TablaSection ─────────────────────────────
const TablaSection = ({ items, tipo, columns, renderRow, statConfig, filters, onFiltersChange }) => {
  const filtered = items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.ref.toLowerCase().includes(q)) return false
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
          <div className="inv-filter-group">
            <i className="ti ti-filter" />
            <select className="inv-select" value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}>
              <option value="">Estado: Todos</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Sin Stock">Sin Stock</option>
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
            <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={`${item.status === 'Low Stock' ? 'inv-row--warning' : ''} ${hoveredRow === item.id ? 'inv-row--hover' : ''}`}
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
const InventarioPage = () => {
  const [activeTab, setActiveTab] = useState('materiales')
  const [showDrawerMat, setShowDrawerMat] = useState(false)
  const [showDrawerProd, setShowDrawerProd] = useState(false)
  const [matFilters, setMatFilters] = useState({ category: '', status: '', search: '', categoryOptions: ['Telas de Seda', 'Linos', 'Terciopelos', 'Tintes y Acabados'] })
  const [prodFilters, setProdFilters] = useState({ category: '', status: '', search: '', categoryOptions: ['Vestidos', 'Chaquetas', 'Accesorios'] })

  // ── Config Materiales ──
  const matStats = (items) => {
    const totalVal = items.reduce((s, m) => s + m.price * m.stock, 0)
    const totalStock = items.reduce((s, m) => s + m.stock, 0)
    const lowCount = items.filter((m) => m.status === 'Low Stock' || m.status === 'Sin Stock').length
    return [
      { color: 'blue', icon: 'ti ti-rollers', value: totalStock.toLocaleString('es-CO'), unit: ' mts', label: 'Stock Total', sub: `${items.length} materiales registrados` },
      { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
      { color: 'green', icon: 'ti ti-coin', value: fmt(totalVal), unit: '', label: 'Valor del Inventario', tag: 'EST', sub: 'costo estimado total' },
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
      <td><span className="inv-cat-tag">{m.category}</span></td>
      <td className="inv-cell-specs">{m.specs}</td>
      <td className="inv-cell-price">{fmt(m.price)}<small className="inv-cell-unit">/m</small></td>
      <td><StockBar current={m.stock} min={m.minStock} /></td>
      <td>
        <span className={`inv-badge ${m.status === 'Low Stock' ? 'inv-badge--low' : m.status === 'Sin Stock' ? 'inv-badge--empty' : 'inv-badge--ok'}`}>
          <i className={`ti ti-${m.status === 'In Stock' ? 'circle-check' : m.status === 'Low Stock' ? 'alert-triangle' : 'x-circle'}`} />
          {m.status}
        </span>
      </td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Editar"><i className="ti ti-edit" /></button>
          <button className="inv-action-btn inv-action-btn--danger" title="Eliminar"><i className="ti ti-trash" /></button>
        </div>
      </td>
    </>
  )

  const matColumns = ['MATERIAL', 'CATEGORÍA', 'ESPECIFICACIONES', 'PRECIO', 'STOCK', 'ESTADO', '']

  // ── Config Productos ──
  const prodStats = (items) => {
    const totalVal = items.reduce((s, p) => s + p.price * p.stock, 0)
    const lowCount = items.filter((p) => p.status === 'Low Stock' || p.status === 'Sin Stock').length
    return [
      { color: 'blue', icon: 'ti ti-hanger', value: items.length, unit: '', label: 'Total Productos', sub: 'en catálogo' },
      { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
      { color: 'green', icon: 'ti ti-coin', value: fmt(totalVal), unit: '', label: 'Valor del Catálogo', tag: 'EST', sub: 'precio de venta total' },
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
      <td><span className="inv-cat-tag">{p.category}</span></td>
      <td className="inv-cell-specs">{p.material}</td>
      <td className="inv-cell-price">{fmt(p.price)}</td>
      <td><StockBar current={p.stock} min={p.minStock} /></td>
      <td>
        <span className={`inv-badge ${p.status === 'Low Stock' ? 'inv-badge--low' : p.status === 'Sin Stock' ? 'inv-badge--empty' : 'inv-badge--ok'}`}>
          <i className={`ti ti-${p.status === 'In Stock' ? 'circle-check' : p.status === 'Low Stock' ? 'alert-triangle' : 'x-circle'}`} />
          {p.status}
        </span>
      </td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Editar"><i className="ti ti-edit" /></button>
          <button className="inv-action-btn inv-action-btn--danger" title="Eliminar"><i className="ti ti-trash" /></button>
        </div>
      </td>
    </>
  )

  const prodColumns = ['PRODUCTO', 'CATEGORÍA', 'MATERIAL', 'PRECIO', 'STOCK', 'ESTADO', '']

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
        <button className="inv-btn-primary" onClick={() => activeTab === 'materiales' ? setShowDrawerMat(true) : setShowDrawerProd(true)}>
          <i className="ti ti-plus" />
          {activeTab === 'materiales' ? 'Añadir Material' : 'Nuevo Producto'}
        </button>
      </div>

      {/* ══ TABS ══ */}
      <div className="inv-tabs">
        {TABS.map((tab) => (
          <button key={tab.id} className={`inv-tab ${activeTab === tab.id ? 'inv-tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <i className={tab.icon} />
            {tab.label}
            <span className="inv-tab-count">{activeTab === tab.id ? (tab.id === 'materiales' ? MATERIALS.length : PRODUCTOS.length) : ''}</span>
          </button>
        ))}
      </div>

      {/* ══ CONTENIDO ══ */}
      {activeTab === 'materiales' && (
        <TablaSection items={MATERIALS} tipo="materiales" columns={matColumns} renderRow={matRenderRow} statConfig={matStats} filters={matFilters} onFiltersChange={setMatFilters} />
      )}
      {activeTab === 'productos' && (
        <TablaSection items={PRODUCTOS} tipo="productos" columns={prodColumns} renderRow={prodRenderRow} statConfig={prodStats} filters={prodFilters} onFiltersChange={setProdFilters} />
      )}

      {/* ══ DRAWERS ══ */}
      {showDrawerMat && <RegisterMaterial isOpen={showDrawerMat} onClose={() => setShowDrawerMat(false)} />}
      {showDrawerProd && <RegisterProducto isOpen={showDrawerProd} onClose={() => setShowDrawerProd(false)} />}
    </div>
  )
}

export default InventarioPage
