import { useState } from 'react'
import RegistrarPago from './RegistrarPago'
import './VentasPage.css'

// ── Datos hardcodeados ─────────────────────────
const VENTAS = [
  { id: 1, pedido_id: 'PED-001', cliente: 'María García López', descripcion: 'Vestido de Noche Seda — Talla M', total: 520000, abonado: 520000, metodo: 'transferencia', estado: 'Pagado', fecha: '2025-01-15' },
  { id: 2, pedido_id: 'PED-003', cliente: 'Alejandro Martínez Ruiz', descripcion: 'Blazer Lino Clásico — Talla L', total: 245000, abonado: 245000, metodo: 'tarjeta', estado: 'Pagado', fecha: '2025-01-18' },
  { id: 3, pedido_id: 'PED-007', cliente: 'Carmen Herrera Díaz', descripcion: 'Vestido de Día Lino + Pañuelo Seda', total: 315000, abonado: 150000, metodo: 'efectivo', estado: 'Abono parcial', fecha: '2025-02-01' },
  { id: 4, pedido_id: 'PED-012', cliente: 'Roberto Sánchez Vega', descripcion: 'Corbata Terciopelo Italia x2', total: 170000, abonado: 0, metodo: null, estado: 'Pendiente', fecha: '2025-02-05' },
  { id: 5, pedido_id: 'PED-015', cliente: 'Laura Jiménez Torres', descripcion: 'Pañuelo Seda Tussar + Vestido Noche', total: 440000, abonado: 200000, metodo: 'transferencia', estado: 'Abono parcial', fecha: '2025-02-10' },
]

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

const VentasPage = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [ventaSel, setVentaSel] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [metodoFilter, setMetodoFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = VENTAS.filter((v) => {
    if (estadoFilter && v.estado !== estadoFilter) return false
    if (metodoFilter && (v.metodo || '') !== metodoFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!v.cliente.toLowerCase().includes(q) && !v.pedido_id.toLowerCase().includes(q)) return false
    }
    return true
  })

  const mesActual = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const totalVendido = VENTAS.reduce((s, v) => s + v.total, 0)
  const totalCobrado = VENTAS.filter(v => v.estado === 'Pagado').reduce((s, v) => s + v.total, 0)
  const pendienteCobrar = VENTAS.reduce((s, v) => s + (v.total - v.abonado), 0)
  const abonosActivos = VENTAS.filter(v => v.estado === 'Abono parcial').length

  const abrirPago = (venta) => { setVentaSel(venta); setShowDrawer(true) }

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
      </div>

      {/* ══ STATS ══ */}
      <div className="vtas-stats">
        <div className="vtas-stat-card" style={{ '--delay': '0s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--blue"><i className="ti ti-chart-bar" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(totalVendido)}</p>
            <p className="vtas-stat-label">Total Vendido <span className="vtas-stat-tag">{mesActual}</span></p>
            <p className="vtas-stat-sub">{VENTAS.length} pedidos procesados</p>
          </div>
        </div>
        <div className="vtas-stat-card" style={{ '--delay': '0.08s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--green"><i className="ti ti-circle-check" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(totalCobrado)}</p>
            <p className="vtas-stat-label">Cobrado</p>
            <p className="vtas-stat-sub">{VENTAS.filter(v => v.estado === 'Pagado').length} ventas completadas</p>
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
        <p className="vtas-filters__count">{filtered.length} de {VENTAS.length} ventas</p>
      </div>

      {/* ══ TABLA ══ */}
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
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}
                onMouseEnter={() => setHoveredRow(v.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="vtas-cell-id">{v.pedido_id}</td>
                <td>
                  <div className="vtas-cell-cliente">
                    <p className="vtas-cliente-name">{v.cliente}</p>
                    <p className="vtas-cliente-desc">{v.descripcion}</p>
                  </div>
                </td>
                <td className="vtas-cell-total">{fmt(v.total)}</td>
                <td><ProgressBar current={v.abonado} total={v.total} /></td>
                <td className={`vtas-cell-saldo ${v.total - v.abonado > 0 ? 'vtas-cell-saldo--pend' : ''}`}>
                  {fmt(v.total - v.abonado)}
                </td>
                <td className="vtas-cell-fecha">{v.fecha}</td>
                <td>
                  {v.metodo ? (
                    <span className="vtas-method-badge">
                      <i className={`ti ti-${metodoIcon[v.metodo]}`} />
                      {v.metodo.charAt(0).toUpperCase() + v.metodo.slice(1)}
                    </span>
                  ) : (
                    <span className="vtas-method-badge vtas-method-badge--none">—</span>
                  )}
                </td>
                <td>
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
                  <div className={`vtas-actions ${hoveredRow === v.id ? 'vtas-actions--visible' : ''}`}>
                    {v.estado !== 'Pagado' ? (
                      <button className="vtas-btn-pago" onClick={() => abrirPago(v)}>
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

      {/* ══ DRAWER ══ */}
      {showDrawer && ventaSel && (
        <RegistrarPago isOpen={showDrawer} onClose={() => { setShowDrawer(false); setVentaSel(null) }} venta={ventaSel} />
      )}
    </div>
  )
}

export default VentasPage
