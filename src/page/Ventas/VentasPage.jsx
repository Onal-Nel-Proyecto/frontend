import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiFileText } from 'react-icons/fi'
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

// ── Generar factura (imprimible) ─────────────
const generarFactura = (venta) => {
  const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const saldo = Math.max(0, venta.total - venta.abonado)

  const facturaHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura — ${venta.pedido_id}</title>
  <style>
    @page { margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff; color: #1a1a1a; line-height: 1.5;
      padding: 2rem;
    }
    .wrap { max-width: 800px; margin: 0 auto; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #C9A23D; }
    .logo h1 { font-size: 1.8rem; font-weight: 800; color: #1a1a1a; letter-spacing: -0.03em; }
    .logo p { font-size: 0.8rem; color: #666; }
    .info { text-align: right; }
    .info h2 { font-size: 1.4rem; color: #C9A23D; margin-bottom: 4px; }
    .info p { font-size: 0.8rem; color: #666; }
    .cli { margin-bottom: 1.5rem; padding: 1rem 1.25rem; background: #f8f6fc; border-radius: 12px; }
    .cli h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 6px; }
    .cli p { font-size: 0.95rem; color: #1a1a1a; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    thead th { text-align: left; padding: 0.7rem 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 1px solid #eee; }
    tbody td { padding: 0.7rem 0.5rem; font-size: 0.85rem; border-bottom: 1px solid #f0f0f0; }
    .tr { border-top: 2px solid #C9A23D; font-weight: 700; }
    .tr td { padding-top: 1rem; }
    .r { text-align: right; }
    .c { text-align: center; }
    .ft { margin-top: 2.5rem; text-align: center; font-size: 0.75rem; color: #999; border-top: 1px solid #eee; padding-top: 1.5rem; }
    .resumen { display: flex; justify-content: flex-end; gap: 2rem; margin-top: 1rem; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <div class="logo"><h1>ona&nel</h1><p>Atelier de Moda</p></div>
      <div class="info">
        <h2>FACTURA</h2>
        <p>N° ${venta.pedido_id}</p>
        <p>Fecha: ${hoy}</p>
      </div>
    </div>
    <div class="cli">
      <h3>Cliente</h3>
      <p>${venta.cliente}</p>
    </div>
    <table>
      <thead><tr><th>Descripción</th><th class="c">Cant.</th><th class="r">Precio Unit.</th><th class="r">Subtotal</th></tr></thead>
      <tbody>
        <tr>
          <td>${venta.descripcion || 'Producto'}</td>
          <td class="c">1</td>
          <td class="r">${fmt(venta.total)}</td>
          <td class="r">${fmt(venta.total)}</td>
        </tr>
      </tbody>
    </table>
    <div class="resumen">
      <div><strong>Total:</strong> ${fmt(venta.total)}</div>
      <div><strong>Abonado:</strong> ${fmt(venta.abonado)}</div>
      <div><strong>${saldo > 0 ? 'Saldo pendiente:' : 'Estado:'}</strong> ${saldo > 0 ? fmt(saldo) : '✓ Pagado'}</div>
    </div>
    <div class="ft">
      <p>ona&nel Atelier — Gracias por su preferencia</p>
      <p style="margin-top:4px">Factura generada el ${hoy}</p>
    </div>
  </div>
  <script>window.onload=function(){window.print()}<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(facturaHTML)
    win.document.close()
  }
}

const VentasPage = () => {
  const navigate = useNavigate()
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
        <button className="vtas-btn-primary" onClick={() => alert('Redirigir a formulario de venta')}>
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
                    onClick={(e) => { e.stopPropagation(); generarFactura(v) }}
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

      {/* ══ DRAWER ══ */}
      {showDrawer && ventaSel && (
        <RegistrarPago isOpen={showDrawer} onClose={() => { setShowDrawer(false); setVentaSel(null) }} venta={ventaSel} />
      )}
    </div>
  )
}

export default VentasPage