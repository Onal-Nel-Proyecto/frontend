import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { FiFileText, FiChevronLeft, FiChevronRight, FiXCircle } from 'react-icons/fi'
import { useVentas } from '../hooks/useVentas'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import RegistrarPago from '../components/RegistrarPago'
import VentaForm from '../components/VentaForm'
import { getFacturaPdfBlob } from '../services/ventasService'
import Alert from '../../../components/ui/feedback/Alert'
import LoadingOverlay from '../../../components/ui/feedback/LoadingOverlay'
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

// ── Números de página para paginación inteligente ──
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);
  if (current <= 2) end = 3;
  if (current >= total - 1) start = total - 2;
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  if (total > 1) pages.push(total);
  return pages;
};

const VentasPage = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  useDocumentTitle('Ventas')
  const [showDrawer, setShowDrawer] = useState(false)
  const [ventaSel, setVentaSel] = useState(null)
  const [showVentaForm, setShowVentaForm] = useState(false)

  // Abrir formulario de registro si se navegó con openForm:true (ej: desde acceso rápido del dashboard)
  useEffect(() => {
    if (location.state?.openForm) {
      setShowVentaForm(true);
      window.history.replaceState(null, '');
    }
  }, [location.state]);

  const [loadingFacturas, setLoadingFacturas] = useState({})

  // ── Leer filtros desde URL ──
  const pagAct = Number(searchParams.get('pagina')) || 1
  const estadoFilter = searchParams.get('estado') || ''
  const busquedaUrl = searchParams.get('busqueda') || ''
  const fechaFiltro = searchParams.get('fechaFiltro') || 'hoy'
  const fechaRegistroParam = searchParams.get('fecha_registro') || ''

  // ── Debounce local para búsqueda ──
  const [searchInput, setSearchInput] = useState(busquedaUrl)
  const [searchQuery, setSearchQuery] = useState(busquedaUrl)
  const debounceRef = useRef(null)

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val.trim())
    }, 400)
  }

  // ── Hook de ventas ──
  const { ventas, meta, resumen, loading, loadVentas, anularVenta } = useVentas()

  const maxPag = meta?.paginas_totales || 1
  const pageNumbers = useMemo(() => getPageNumbers(pagAct, maxPag), [pagAct, maxPag])
  const todayStr = useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, [])

  // ── Sincronizar URL y cargar datos cuando cambian los filtros ──
  useEffect(() => {
    // Construir URL limpia: solo parámetros con valores significativos
    const params = new URLSearchParams()
    if (pagAct > 1) params.set('pagina', String(pagAct))
    if (searchQuery) params.set('busqueda', searchQuery)
    if (estadoFilter) params.set('estado', estadoFilter)
    if (fechaFiltro !== 'hoy') params.set('fechaFiltro', fechaFiltro)
    if (fechaFiltro === 'personalizado' && fechaRegistroParam) params.set('fecha_registro', fechaRegistroParam)

    const currentStr = searchParams.toString()
    const nextStr = params.toString()
    if (currentStr !== nextStr) {
      setSearchParams(params, { replace: true })
    }

    // Determinar fecha_registro para la API
    let fechaRegistro = undefined
    if (fechaFiltro === 'hoy') {
      fechaRegistro = todayStr
    } else if (fechaFiltro === 'personalizado' && fechaRegistroParam) {
      fechaRegistro = fechaRegistroParam
    }

    // Cargar datos con los filtros actuales
    const controller = new AbortController()
    loadVentas({
      pagina: pagAct,
      limite: 15,
      busqueda: searchQuery || undefined,
      estado: estadoFilter || undefined,
      fechaRegistro,
    }, controller.signal)
    return () => controller.abort()
  }, [pagAct, searchQuery, estadoFilter, fechaFiltro, fechaRegistroParam, loadVentas, todayStr]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Limpiar debounce al desmontar ──
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handlePageChange = (page) => {
    if (page < 1 || page > maxPag) return
    const params = new URLSearchParams(searchParams)
    params.set('pagina', String(page))
    setSearchParams(params, { replace: true })
  }

  const handleEstadoChange = (e) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams)
    if (val) params.set('estado', val)
    else params.delete('estado')
    params.set('pagina', '1')
    setSearchParams(params, { replace: true })
  }

  const limpiarFiltros = () => {
    setSearchInput('')
    setSearchQuery('')
    setSearchParams({}, { replace: true })
  }

  const handleFechaFiltroChange = (e) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams)
    if (val === 'personalizado') {
      params.set('fechaFiltro', 'personalizado')
      params.set('fecha_registro', todayStr)
    } else if (val === 'todos') {
      params.set('fechaFiltro', 'todos')
      params.delete('fecha_registro')
    } else {
      params.delete('fechaFiltro')
      params.delete('fecha_registro')
    }
    params.set('pagina', '1')
    setSearchParams(params, { replace: true })
  }

  const handleFechaRegistroChange = (e) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams)
    if (val) params.set('fecha_registro', val)
    else params.delete('fecha_registro')
    params.set('pagina', '1')
    setSearchParams(params, { replace: true })
  }

  // Stats desde el resumen del backend
  const totalVendidoData = resumen?.total_vendido
  const totalVendido = totalVendidoData?.total ?? 0
  const ventasProcesadas = totalVendidoData?.ventas_procesadas ?? 0
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const totalVendidoMes = totalVendidoData?.mes
    ? `${MONTHS[totalVendidoData.mes - 1]} ${new Date().getFullYear()}`
    : new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const totalCobradoData = resumen?.total_cobrado
  const totalCobrado = totalCobradoData?.total ?? 0
  const ventasCompletadas = totalCobradoData?.ventas_completadas ?? 0
  const pendienteCobrar = resumen?.cobro_pendiente ?? 0
  const abonosActivos = resumen?.abonos ?? 0
  const ingresoHoyData = resumen?.ingreso_hoy
  const ingresoHoyTotal = ingresoHoyData?.total ?? 0
  const ingresoHoyVentas = ingresoHoyData?.ventas_cantidad ?? 0
  const cobradoHoy = resumen?.cobrado_hoy ?? 0

  const abrirPago = (venta) => { setVentaSel(venta); setShowDrawer(true) }

  // ── Anular venta ──
  const [anularTarget, setAnularTarget] = useState(null)
  const [anularLoading, setAnularLoading] = useState(false)
  const [anularResult, setAnularResult] = useState(null)

  const iniciarAnulacion = (venta) => {
    setAnularTarget(venta)
  }

  const confirmarAnulacion = async () => {
    if (!anularTarget) return
    const id = anularTarget.id
    setAnularTarget(null)
    setAnularLoading(true)
    try {
      await anularVenta(id)
      setAnularLoading(false)
      setAnularResult({
        type: 'success',
        title: 'Venta anulada',
        message: `La venta #${id} ha sido anulada correctamente.`,
        onClose: () => setAnularResult(null),
      })
    } catch (err) {
      setAnularLoading(false)
      setAnularResult({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo anular la venta',
        onClose: () => setAnularResult(null),
      })
    }
  }

  const cancelarAnulacion = () => {
    setAnularTarget(null)
  }

  const handleDownloadFactura = async (venta) => {
    const id = venta.id
    setLoadingFacturas((prev) => ({ ...prev, [id]: true }))
    try {
      const { blob, filename } = await getFacturaPdfBlob(venta.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      console.log(filename)
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      console.error('Error al descargar factura')
    } finally {
      setLoadingFacturas((prev) => ({ ...prev, [id]: false }))
    }
  }

  const irADetalle = (venta) => {
    navigate(`/ventas/${venta.id}`, { state: { venta } })
  }

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
            <p className="vtas-stat-label">Total Vendido <span className="vtas-stat-tag">{totalVendidoMes}</span></p>
            <p className="vtas-stat-sub">{ventasProcesadas} ventas procesadas</p>
          </div>
        </div>
        <div className="vtas-stat-card" style={{ '--delay': '0.08s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--green"><i className="ti ti-circle-check" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(totalCobrado)}</p>
            <p className="vtas-stat-label">Cobrado</p>
            <p className="vtas-stat-sub">{ventasCompletadas} ventas completadas</p>
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
        <div className="vtas-stat-card" style={{ '--delay': '0.32s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--info"><i className="ti ti-coin" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(ingresoHoyTotal)}</p>
            <p className="vtas-stat-label">Ingresos hoy</p>
            <p className="vtas-stat-sub">{ingresoHoyVentas} ventas procesadas hoy</p>
          </div>
        </div>
        <div className="vtas-stat-card" style={{ '--delay': '0.40s' }}>
          <div className="vtas-stat-icon vtas-stat-icon--gold"><i className="ti ti-cash" /></div>
          <div>
            <p className="vtas-stat-value">{fmt(cobradoHoy)}</p>
            <p className="vtas-stat-label">Cobrado hoy</p>
            <p className="vtas-stat-sub">total cobrado del día</p>
          </div>
        </div>
      </div>

      {/* ══ FILTROS ══ */}
      <div className="vtas-filters">
        <div className="vtas-filters__left">
          <div className="vtas-filter-group">
            <i className="ti ti-filter" />
            <select className="vtas-select" value={estadoFilter} onChange={handleEstadoChange}>
              <option value="">Estado de pago: Todos</option>
              <option value="SIN PAGAR">Pendiente</option>
              <option value="ADELANTADO">Abono parcial</option>
              <option value="PAGADO">Pagado</option>
            </select>
          </div>
          <div className="vtas-filter-group">
            <i className="ti ti-calendar" />
            <select className="vtas-select" value={fechaFiltro} onChange={handleFechaFiltroChange}>
              <option value="hoy">Hoy</option>
              <option value="personalizado">Personalizado</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          {fechaFiltro === 'personalizado' && (
            <div className="vtas-filter-group">
              <i className="ti ti-calendar-event" />
              <input
                type="date"
                className="vtas-select vtas-date-input"
                value={fechaRegistroParam}
                onChange={handleFechaRegistroChange}
                max={todayStr}
              />
            </div>
          )}
          <div className="vtas-search">
            <i className="ti ti-search" />
            <input type="text" placeholder="Buscar cliente..." value={searchInput} onChange={handleSearchChange} maxLength={300} />
          </div>
        </div>
        <p className="vtas-filters__count">{ventas.length} ventas{estadoFilter || searchQuery ? ' filtradas' : ''}</p>
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

      {/* ══ TABLA (escritorio/tablet) ══ */}
      {!loading && !isMobile && (
      <div className="vtas-table-wrap">
        <table className="vtas-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Abonado</th>
              <th>Saldo</th>
              <th>Fecha</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id}
                className="vtas-row-clickable"
              >
                <td className="vtas-cell-id" onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>{v.id}</td>
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
                <td className="vtas-cell-fecha" onClick={() => irADetalle(v)} style={{ cursor: 'pointer' }}>{v.fecha_limite_pago || '—'}</td>
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
                  <div className="vtas-cell-actions">
                    <button
                      className="vtas-btn-factura"
                      onClick={(e) => { e.stopPropagation(); handleDownloadFactura(v) }}
                      title="Generar factura"
                      disabled={loadingFacturas[v.id]}
                    >
                      {loadingFacturas[v.id] ? (
                        <i className="ti ti-loader ti-spin" style={{ fontSize: '14px' }} />
                      ) : (
                        <FiFileText size={14} />
                      )}
                    </button>
                    <button
                      className="vtas-btn-factura vtas-btn-anular"
                      onClick={(e) => { e.stopPropagation(); iniciarAnulacion(v) }}
                      title="Anular venta"
                    >
                      <FiXCircle size={14} />
                    </button>
                    {v.estado !== 'Pagado' ? (
                      <div className="vtas-actions">
                        <button className="vtas-btn-pago" onClick={(e) => { e.stopPropagation(); abrirPago(v) }} title="Registrar pago">
                          <i className="ti ti-coin" />
                        </button>
                      </div>
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
        {ventas.length === 0 && !loading && (
          <div className="vtas-empty-state">
            <i className="ti ti-search-off" />
            <p>No se encontraron ventas con esos filtros.</p>
            <button className="vtas-empty-btn" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Paginación */}
        {maxPag > 1 && (
          <div className="vtas-pagination">
            <FiChevronLeft
              className={`vtas-page-arrow ${pagAct <= 1 ? 'vtas-page-arrow--disabled' : ''}`}
              onClick={() => handlePageChange(pagAct - 1)}
            />
            {pageNumbers.map((n, i) =>
              n === '...' ? (
                <span key={`ellipsis-${i}`} className="vtas-page-ellipsis">…</span>
              ) : (
                <span
                  key={n}
                  className={`vtas-page-num ${n === pagAct ? 'vtas-page-num--active' : ''}`}
                  onClick={() => handlePageChange(n)}
                >{n}</span>
              )
            )}
            <FiChevronRight
              className={`vtas-page-arrow ${pagAct >= maxPag ? 'vtas-page-arrow--disabled' : ''}`}
              onClick={() => handlePageChange(pagAct + 1)}
            />
          </div>
        )}
      </div>
      )}

      {/* ══ VISTA MÓVIL / TABLET (tarjetas) ══ */}
      {!loading && isMobile && (
        <div className="vtas-mobile-list">
          {ventas.length === 0 && !loading ? (
            <div className="vtas-empty-state">
              <i className="ti ti-search-off" />
              <p>No se encontraron ventas con esos filtros.</p>
              <button className="vtas-empty-btn" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            ventas.map((v) => (
              <div key={v.id} className="vtas-mobile-card" onClick={() => irADetalle(v)}>
                {/* Header: ID + estado */}
                <div className="vtas-mobile-header">
                  <span className="vtas-cell-id">{v.id}</span>
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
                </div>

                {/* Cliente */}
                <div className="vtas-mobile-cliente">
                  <p className="vtas-cliente-name">{v.cliente}</p>
                  {v.descripcion && <p className="vtas-cliente-desc">{v.descripcion}</p>}
                </div>

                {/* Grid de datos: Total + Fecha */}
                <div className="vtas-mobile-grid">
                  <div className="vtas-mobile-field">
                    <span className="vtas-mobile-label">Total</span>
                    <span className="vtas-mobile-value vtas-mobile-value--total">{fmt(v.total)}</span>
                  </div>
                  <div className="vtas-mobile-field">
                    <span className="vtas-mobile-label">Fecha</span>
                    <span className="vtas-mobile-value">{v.fecha}</span>
                  </div>
                  {v.fecha_limite_pago && (
                    <div className="vtas-mobile-field">
                      <span className="vtas-mobile-label">Vencimiento</span>
                      <span className="vtas-mobile-value">{v.fecha_limite_pago}</span>
                    </div>
                  )}
                </div>

                {/* Abonado con barra de progreso */}
                <div className="vtas-mobile-abonado">
                  <span className="vtas-mobile-label">Abonado</span>
                  <ProgressBar current={v.abonado} total={v.total} />
                </div>

                {/* Saldo */}
                <div className="vtas-mobile-saldo">
                  <span className="vtas-mobile-label">Saldo</span>
                  <span className={`vtas-mobile-value ${
                    v.total - v.abonado > 0 ? 'vtas-mobile-saldo--pend' : ''
                  }`}>
                    {fmt(v.total - v.abonado)}
                  </span>
                </div>

                {/* Footer: acciones */}
                <div className="vtas-mobile-footer">
                  <button
                    className="vtas-btn-factura"
                    onClick={(e) => { e.stopPropagation(); handleDownloadFactura(v) }}
                    title="Generar factura"
                    disabled={loadingFacturas[v.id]}
                  >
                    {loadingFacturas[v.id] ? (
                      <i className="ti ti-loader ti-spin" style={{ fontSize: '14px' }} />
                    ) : (
                      <FiFileText size={14} />
                    )}
                  </button>
                  <button
                    className="vtas-btn-factura vtas-btn-anular"
                    onClick={(e) => { e.stopPropagation(); iniciarAnulacion(v) }}
                    title="Anular venta"
                  >
                    <FiXCircle size={14} />
                  </button>
                  {v.estado !== 'Pagado' ? (
                    <button
                      className="vtas-btn-pago vtas-mobile-btn-pago"
                      onClick={(e) => { e.stopPropagation(); abrirPago(v) }}
                      title="Registrar pago"
                    >
                      <i className="ti ti-coin" />
                      Registrar pago
                    </button>
                  ) : (
                    <span className="vtas-paid-badge">
                      <i className="ti ti-circle-check-filled" />
                      Pagado
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Paginación móvil */}
          {maxPag > 1 && (
            <div className="vtas-pagination">
              <FiChevronLeft
                className={`vtas-page-arrow ${pagAct <= 1 ? 'vtas-page-arrow--disabled' : ''}`}
                onClick={() => handlePageChange(pagAct - 1)}
              />
              {pageNumbers.map((n, i) =>
                n === '...' ? (
                  <span key={`ellipsis-${i}`} className="vtas-page-ellipsis">…</span>
                ) : (
                  <span
                    key={n}
                    className={`vtas-page-num ${n === pagAct ? 'vtas-page-num--active' : ''}`}
                    onClick={() => handlePageChange(n)}
                  >{n}</span>
                )
              )}
              <FiChevronRight
                className={`vtas-page-arrow ${pagAct >= maxPag ? 'vtas-page-arrow--disabled' : ''}`}
                onClick={() => handlePageChange(pagAct + 1)}
              />
            </div>
          )}
        </div>
      )}

      {/* ══ DRAWERS ══ */}
      {showVentaForm && (
        <VentaForm isOpen={showVentaForm} onClose={() => setShowVentaForm(false)} />
      )}
      {showDrawer && ventaSel && (
        <RegistrarPago isOpen={showDrawer} onClose={() => { setShowDrawer(false); setVentaSel(null) }} onSuccess={() => loadVentas({ pagina: pagAct, limite: 15, busqueda: searchQuery || undefined, estado: estadoFilter || undefined })} venta={ventaSel} />
      )}

      {/* ══ CONFIRMACIÓN ANULAR ══ */}
      {anularTarget && (
        <Alert
          type="confirm"
          title="¿Anular venta?"
          message={`Estás a punto de anular la venta #${anularTarget.id} de ${anularTarget.cliente}. Esta acción no se puede deshacer.`}
          onCancel={cancelarAnulacion}
          onConfirm={confirmarAnulacion}
        />
      )}

      {anularLoading && <LoadingOverlay title="Anulando venta…" message="Procesando la solicitud" />}
      {anularResult && <Alert type={anularResult.type} title={anularResult.title} message={anularResult.message} onClose={anularResult.onClose} />}
    </div>
  )
}

export default VentasPage