// ================================================================
// TablaSection — Tabla reutilizable con estadísticas, filtros y
// paginación. Usada por materiales, productos y abastecimientos.
// ================================================================

import { useState } from 'react'

/**
 * @param {Array}  items       - Datos filtrados a mostrar
 * @param {boolean} loading     - Estado de carga
 * @param {string} tipo         - Etiqueta del tipo (materiales/productos/abastecimientos)
 * @param {Array}  columns      - Nombres de las columnas
 * @param {Function} renderRow  - Renderiza una fila (<td>...</td>)
 * @param {Function} statConfig - Calcula las tarjetas de estadísticas
 * @param {Object} filters      - Estado actual de los filtros
 * @param {Function} onFiltersChange - Callback para cambiar filtros
 * @param {Array}  statusOptions - Opciones de filtro de estado
 * @param {Object} pagination   - { page, totalPages, onPageChange }
 * @param {number} totalItems   - Total de registros
 */
const TablaSection = ({ items, loading, tipo, columns, renderRow, statConfig, filters, onFiltersChange, statusOptions, pagination, totalItems }) => {
  const [hoveredRow, setHoveredRow] = useState(null)
  const stats = statConfig(items)

  if (loading) {
    return <div className="inv-loading"><i className="ti ti-loader ti-spin" /> Cargando {tipo}...</div>
  }

  return (
    <>
      {/* ── Stats ── */}
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

      {/* ── Filtros ── */}
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

      {/* ── Tabla ── */}
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

      {/* ── Paginación ── */}
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

export default TablaSection
