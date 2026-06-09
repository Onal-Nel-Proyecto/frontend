import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiFileText } from 'react-icons/fi'
import { useVentas } from '../../hooks/useVentas'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import RegistrarPago from './RegistrarPago'
import VentaForm from './VentaForm'
import { downloadFacturaPdf } from '../../api/ventasService'
import './VentasPage.css'

// ── Los datos se cargan desde useVentas (API con fallback local) ──

const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// ── Barra de progreso de abono ───────────────
const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0
  return (
    <div className="vtas-progress-wrap">
      <div className="vtas-progress-bar">
        <div className="vtas-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="vtas-progress-text">{fmt(current)}</span>
    </div>
  )
}

// ── Descargar factura PDF desde el backend ──
const handleDownloadFactura = (venta) => {
  const id = venta.pedido_id || venta.id
  downloadFacturaPdf(id)
}

const VentasPage = () => {
  const navigate = useNavigate()
  useDocumentTitle('Ventas')
  const [showDrawer, setShowDrawer] = useState(false)
  const [ventaSel, setVentaSel] = useState(null)
  const [showVentaForm, setShowVentaForm] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [metodoFilter, setMetodoFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Hook de ventas (API + fallback) ──
  const { ventas, loading } = useVentas()

  const filtered = ventas.filter((v) => {
    if (estadoFilter && v.estado !== estadoFilter) return false
    if (metodoFilter && (v.metodo || '') !== metodoFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!v.cliente.toLowerCase().includes(q) && !v.pedido_id.toLowerCase().includes(q)) return false
    }
    return true
  })

  const mesActual = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const totalVendido = ventas.reduce((s, v) => s + v.total, 0)
  const totalCobrado = ventas.filter(v => v.estado === 'Pagado').reduce((s, v) => s + v.total, 0)
  const pendienteCobrar = ventas.reduce((s, v) => s + (v.total - v.abonado), 0)
  const abonosActivos = ventas.filter(v => v.estado === 'Abono parcial').length

  const abrirPago = (venta) => { setVentaSel(venta); setShowDrawer(true) }

  const irADetalle = (venta) => {
    navigate(`/ventas/${venta.pedido_id || venta.id}`, { state: { venta } })
  }

  const metodoIcon = { efectivo: 'cash', tarjeta: 'credit-card', transferencia: 'building-bank' }

  return (
    <div className="vtas-content">

      {/* ══ HEADER ══ */}
      <div className="vtas-header">
        <div className="vtas-header-left">
          <div className="vtas-header-icon">
            <i className="ti ti-coin" />
          </div>
          <div>
            <h1 className="vtas-title">Ventas</h1>
            <p className="vtas-subtitle">Gestiona los cobros y pagos de pedidos terminados.</p>
          </div>
        </div>
        <button className="vtas-btn-primary" onClick={() => setShowVentaForm(true)}>
          <i className="ti ti-plus" />
          Nueva Venta
        </button>
      </div>

      {/* ══ STATS ══ */}
      <div className="vtas-stats">
        <div className="vtas-stat-card" style={{ '--delay': '0s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--blue"><i className="ti ti-chart-bar" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(totalVendido)}</p>
            <p className="vtas-stat-label">Total Vendido <span className="vtas-stat-tag">{mesActual}</span></p>
            <p className="vtas-stat-sub">{ventas.length} pedidos procesados</p>
          </div>
        </div>
        <div className="vtas-stat-card" style={{ '--delay': '0.08s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--green"><i className="ti ti-circle-check" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(totalCobrado)}</p>
            <p className="vtas-stat-label">Cobrado</p>
            <p className="vtas-stat-sub">{ventas.filter(v => v.estado === 'Pagado').length} ventas completadas</p>
          </div>
        </div>
        <div className="vtas-stat-card" style={{ '--delay': '0.16s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--orange"><i className="ti ti-clock" /></div>
          <div>
            <p className="vtas-stat-value vtas-stat-value--orange">{fmt(pendienteCobrar)}</p>
            <p className="vtas-stat-label">Pendiente por cobrar</p>
            <p className="vtas-stat-sub">saldo restante total</p>
          </div>
        </div>
        <div className="vtas-stat-card" style={{ '--delay': '0.24s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--purple"><i className="ti ti-receipt-2" /></div>
          <div>
            <p className="vtas-stat-value">{abonosActivos}</p>
            <p className="vtas-stat-label">Abonos parciales activos</p>
            <p className="vtas-stat-sub">pagos fraccionados en curso</p>
          </div>
        </div>
      </div>

      {/* ══ FILTROS ══ */}
      <div className="vtas-filters">
        <div className="vtas-filters__left">
          <div className="vtas-filter-group">
            <i className="ti ti-filter" />
            <select className="vtas-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
              <option value="">Estado de pago: Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Abono parcial">Abono parcial</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
          <div className="vtas-filter-group">
            <i className="ti ti-category" />
            <select className="vtas-select" value={metodoFilter} onChange={(e) => setMetodoFilter(e.target.value)}>
              <option value="">Método de pago: Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="vtas-search">
            <i className="ti ti-search" />
            <input type="text" placeholder="Buscar cliente o pedido..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <p className="vtas-filters__count">{filtered.length} de {ventas.length} ventas</p>
      </div>

      {/* ══ LOADING ══ */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div style={{ textAlign: 'center' }}>
            <i className="ti ti-loader ti-spin" style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '0.75rem', display: 'block' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Cargando ventas…</p>
          </div>
        </div>
      )}

      {/* ══ TABLA ══ */}
      {!loading && (
      <div className="vtas-table-wrap">
        <table className="vtas-table">
          <thead>
            <tr>
              <th>N° Pedido</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Abonado</th>
              <th>Saldo</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Factura</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}
                className="vtas-row-clickable"
                onMouseEnter={() => setHoveredRow(v.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="vtas-cell-id" onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>{v.pedido_id}</td>
                <td onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>
                  <div className="vtas-cell-cliente">
                    <p className="vtas-cliente-name">{v.cliente}</p>
                    <p className="vtas-cliente-desc">{v.descripcion}</p>
                  </div>
                </td>
                <td className="vtas-cell-total" onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>{fmt(v.total)}</td>
                <td onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}><ProgressBar current={v.abonado} total={v.total} /></td>
                <td className={`vtas-cell-saldo ${v.total - v.abonado > 0 ? 'vtas-cell-saldo--pend' : ''}`} onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>
                  {fmt(v.total - v.abonado)}
                </td>
                <td className="vtas-cell-fecha" onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>{v.fecha}</td>
                <td onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>
                  {v.metodo ? (
                    <span className="vtas-method-badge">
                      <i className={`ti ti-${metodoIcon[v.metodo] || 'circle'}`} />
                      {v.metodo.charAt(0).toUpperCase() + v.metodo.slice(1)}
                    </span>
                  ) : (
                    <span className="vtas-method-badge vtas-method-badge--none">—</span>
                  )}
                </td>
                <td onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>
                  <span className={`vtas-badge ${
                    v.estado === 'Pagado' ? 'vtas-badge--ok' :
                    v.estado === 'Abono parcial' ? 'vtas-badge--abono' : 'vtas-badge--pend'
                  }`}>
                    <i className={`ti ti-${
                      v.estado === 'Pagado' ? 'circle-check' :
                      v.estado === 'Abono parcial' ? 'receipt-2' : 'clock'
                    }`} />
                    {v.estado}
                  </span>
                </td>
                <td>
                  <button
                    className="vtas-btn-factura"
                    onClick={(e) => { e.stopPropagation(); handleDownloadFactura(v) }}
                    title="Generar factura"
                  >
                    <FiFileText size={14} />
                  </button>
                </td>
                <td>
                  <div className={`vtas-actions ${hoveredRow === v.id ? 'vtas-actions--visible' : ''}`}>
                    {v.estado !== 'Pagado' ? (
                      <button className="vtas-btn-pago" onClick={(e) => { e.stopPropagation(); abrirPago(v) }}>
                        <i className="ti ti-coin" />
                        Cobrar
                      </button>
                    ) : (
                      <span className="vtas-paid-badge">
                        <i className="ti ti-circle-check-filled" />
                        Pagado
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="vtas-empty-state">
            <i className="ti ti-search-off" />
            <p>No se encontraron ventas con esos filtros.</p>
            <button className="vtas-empty-btn" onClick={() => { setEstadoFilter(''); setMetodoFilter(''); setSearchQuery('') }}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      )}

      {/* ══ DRAWERS ══ */}
      {showVentaForm && (
        <VentaForm isOpen={showVentaForm} onClose={() => setShowVentaForm(false)} />
      )}
      {showDrawer && ventaSel && (
        <RegistrarPago isOpen={showDrawer} onClose={() => { setShowDrawer(false); setVentaSel(null) }} venta={ventaSel} />
      )}
    </div>
  )
}

export default VentasPage