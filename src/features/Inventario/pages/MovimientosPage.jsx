// ================================================================
// MovimientosPage — Página de movimientos de inventario
// Tabla paginada con filtros que consume GET /movimientos
// ================================================================

import { useState, useEffect, useCallback } from 'react'
import axiosInstance from '../../../api/axiosInstance'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import MovimientosFilters from './MovimientosFilters'
import './MovimientosPage.css'

// ════════════════════════════════════════════
//  CONSTANTES
// ════════════════════════════════════════════

const BADGE_COLORS = {
  VENTA: 'mov-badge--venta',
  COMPRA: 'mov-badge--compra',
  PRODUCCION: 'mov-badge--produccion',
  AJUSTE: 'mov-badge--ajuste',
}

const TIPO_MOV_LABELS = {
  VENTA: 'Venta',
  COMPRA: 'Compra',
  PRODUCCION: 'Producción',
  AJUSTE: 'Ajuste',
}

// ════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════

/**
 * Construye una query string a partir de un objeto de filtros.
 * Los valores vacíos / null / undefined se omiten automáticamente.
 *
 * @param {Object} filtros - Objeto con pares clave/valor
 * @returns {string} Query string (ej: "?pag=2&tipo_mov=VENTA")
 */
const buildQueryString = (filtros) => {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, String(value))
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Formatea una fecha ISO "YYYY-MM-DD HH:mm:ss" a "DD/MM/YYYY HH:mm"
 * @param {string} str
 * @returns {string}
 */
const formatFechaHora = (str) => {
  if (!str) return '—'
  const [datePart, timePart] = str.split(' ')
  if (!datePart) return str
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return str
  const hora = timePart ? timePart.slice(0, 5) : '00:00'
  return `${day}/${month}/${year} ${hora}`
}

// ════════════════════════════════════════════
//  COMPONENTES INTERNOS
// ════════════════════════════════════════════

/**
 * SkeletonLoader — Esqueleto de carga para la tabla
 * Muestra filas animadas mientras se espera la respuesta
 */
const SkeletonLoader = () => (
  <div className="mov-skeleton">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="mov-skeleton-row">
        <div className="mov-skeleton-cell" style={{ width: '6%' }} />
        <div className="mov-skeleton-cell" style={{ width: '10%' }} />
        <div className="mov-skeleton-cell" style={{ width: '28%' }} />
        <div className="mov-skeleton-cell" style={{ width: '12%' }} />
        <div className="mov-skeleton-cell" style={{ width: '8%' }} />
        <div className="mov-skeleton-cell" style={{ width: '16%' }} />
        <div className="mov-skeleton-cell" style={{ width: '20%' }} />
      </div>
    ))}
  </div>
)

/**
 * MovBadge — Badge coloreado para el tipo de movimiento
 */
const MovBadge = ({ tipo }) => (
  <span className={`mov-badge ${BADGE_COLORS[tipo] || ''}`}>
    {TIPO_MOV_LABELS[tipo] || tipo}
  </span>
)

/**
 * SuministroCell — Muestra nombre + referencia como subtexto
 */
const SuministroCell = ({ nombre, referenciaId }) => (
  <div className="mov-suministro-cell">
    <span className="mov-suministro-nombre">{nombre || '—'}</span>
    {referenciaId && <span className="mov-suministro-ref">{referenciaId}</span>}
  </div>
)

/**
 * TipoSuministroChip — Chip para PRODUCTO / MATERIAL
 */
const TipoSuministroChip = ({ tipo }) => (
  <span className={`mov-chip ${tipo === 'PRODUCTO' ? 'mov-chip--producto' : 'mov-chip--material'}`}>
    {tipo || '—'}
  </span>
)

// ════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════

/**
 * MovimientosPage — Página de consulta de movimientos de inventario
 *
 * Flujo:
 * 1. Al montar, fetch inicial con pag=1 sin filtros
 * 2. El usuario ajusta filtros y presiona "Buscar" → fetch con filtros + pag=1
 * 3. El usuario navega entre páginas → fetch con filtros activos + nueva página
 * 4. "Limpiar filtros" resetea todo y recarga sin filtros
 */
const MovimientosPage = () => {
  useDocumentTitle('Inventario | Movimientos')

  /* ── Estado de datos ── */
  const [data, setData] = useState([])
  const [pagAct, setPagAct] = useState(1)
  const [maxPag, setMaxPag] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /* ── Filtros activos (los que el child envía vía onBuscar) ── */
  const [filtrosActivos, setFiltrosActivos] = useState({})

  /* ── Key para forzar remount del child al resetear desde empty state ── */
  const [filtrosKey, setFiltrosKey] = useState(0)

  /* ── El child llama esto con los filtros actuales ── */
  const handleBuscar = useCallback((filtros) => {
    setPagAct(1)
    setFiltrosActivos({ ...filtros })
  }, [])

  /* ── Reset desde empty state: limpia todo y remountea el child ── */
  const handleLimpiar = () => {
    setFiltrosActivos({})
    setPagAct(1)
    setFiltrosKey((k) => k + 1)
  }

  /* ── Handle cambio de página ── */
  const handlePagChange = (nuevaPag) => {
    if (nuevaPag < 1 || nuevaPag > maxPag) return
    setPagAct(nuevaPag)
  }

  /* ── Fetch de movimientos ── */
  const fetchMovimientos = useCallback(async (pagina, filtrosAplicados) => {
    setLoading(true)
    setError(null)

    try {
      const params = { pag: pagina, ...filtrosAplicados }
      const qs = buildQueryString(params)
      console.log('[Movimientos] URL:', `/movimientos${qs}`, '| params:', JSON.stringify(params))
      const response = await axiosInstance.get(`/movimientos${qs}`)
      const body = response.data
      console.log('[Movimientos] Respuesta cruda:', body)

      // Intentar extraer data desde distintos formatos de respuesta
      let lista = []
      let totalPag = 1
      let pagActual = pagina

      if (Array.isArray(body)) {
        // Respuesta es directamente un array
        lista = body
      } else if (Array.isArray(body?.data)) {
        // { data: [...], maxPag: N, pagAct: N }
        lista = body.data
        totalPag = body.maxPag ?? 1
        pagActual = body.pagAct ?? pagina
      } else if (body?.data && Array.isArray(body.data.data)) {
        // { status: true, data: { data: [...], maxPag, pagAct } }
        lista = body.data.data
        totalPag = body.data.maxPag ?? 1
        pagActual = body.data.pagAct ?? pagina
      } else {
        console.warn('[Movimientos] Formato de respuesta no reconocido:', body)
      }

      setData(lista)
      setMaxPag(totalPag)
      setPagAct(pagActual)
    } catch (err) {
      console.error('[Movimientos] Error:', err)
      const msg = err?.response?.data?.message || err?.response?.data?.msg || err?.message || 'Error al cargar los movimientos'
      setError(msg)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Efecto: dispara fetch cuando cambian pagAct o filtrosActivos ── */
  useEffect(() => {
    fetchMovimientos(pagAct, filtrosActivos)
  }, [pagAct, filtrosActivos, fetchMovimientos])

  return (
    <div className="mov-content">
      {/* ── Panel de filtros (key force-remount al resetear) ── */}
      <MovimientosFilters
        key={filtrosKey}
        onBuscar={handleBuscar}
        cargando={loading}
      />

      {/* ── Tabla de movimientos ── */}
      <div className="mov-table-wrap">
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          /* ── Estado de error ── */
          <div className="mov-state">
            <div className="mov-state-icon mov-state-icon--error">
              <i className="ti ti-alert-circle" />
            </div>
            <p className="mov-state-title">Error al cargar los datos</p>
            <p className="mov-state-desc">{error}</p>
            <button
              className="mov-btn mov-btn--primary mov-btn--sm"
              onClick={() => fetchMovimientos(pagAct, filtrosActivos)}
              type="button"
            >
              <i className="ti ti-refresh" />
              Reintentar
            </button>
          </div>
        ) : data.length === 0 ? (
          /* ── Estado vacío ── */
          <div className="mov-state">
            <div className="mov-state-icon mov-state-icon--empty">
              <i className="ti ti-search-off" />
            </div>
            <p className="mov-state-title">Sin resultados</p>
            <p className="mov-state-desc">No se encontraron movimientos con los filtros aplicados</p>
            <button
              className="mov-btn mov-btn--ghost mov-btn--sm"
              onClick={handleLimpiar}
              type="button"
            >
              <i className="ti ti-x" />
              Limpiar filtros
            </button>
          </div>
        ) : (
          /* ── Tabla con datos ── */
          <>
            <table className="mov-table">
              <thead>
                <tr>
                  <th className="mov-th mov-th--id">ID</th>
                  <th className="mov-th">Tipo</th>
                  <th className="mov-th">Suministro</th>
                  <th className="mov-th">Tipo suministro</th>
                  <th className="mov-th mov-th--num">Cantidad</th>
                  <th className="mov-th">Fecha</th>
                  <th className="mov-th">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.map((mov) => (
                  <tr key={mov.id_mov} className="mov-tr">
                    <td className="mov-td mov-td--id">{mov.id_mov}</td>
                    <td className="mov-td">
                      <MovBadge tipo={mov.tipo_mov} />
                    </td>
                    <td className="mov-td">
                      <SuministroCell
                        nombre={mov.suministro?.nombre}
                        referenciaId={mov.suministro?.referencia_id}
                      />
                    </td>
                    <td className="mov-td">
                      <TipoSuministroChip tipo={mov.tipo_suministro} />
                    </td>
                    <td className="mov-td mov-td--num">{mov.cantidad ?? '—'}</td>
                    <td className="mov-td mov-td--fecha">
                      {formatFechaHora(mov.fecha)}
                    </td>
                    <td className="mov-td mov-td--usuario">
                      {mov.usuario
                        ? `${mov.usuario.user_nombres} ${mov.usuario.user_apellidos}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Paginación ── */}
            <div className="mov-pagination">
              <span className="mov-pagination-info">
                Página {pagAct} de {maxPag}
              </span>
              <div className="mov-pagination-btns">
                <button
                  className="mov-pagination-btn"
                  disabled={pagAct <= 1}
                  onClick={() => handlePagChange(pagAct - 1)}
                  type="button"
                >
                  <i className="ti ti-chevron-left" />
                  Anterior
                </button>
                <button
                  className="mov-pagination-btn"
                  disabled={pagAct >= maxPag}
                  onClick={() => handlePagChange(pagAct + 1)}
                  type="button"
                >
                  Siguiente
                  <i className="ti ti-chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MovimientosPage
