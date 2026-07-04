// ================================================================
// MovimientosFilters — Panel de filtros para movimientos de inventario
//
// Diseño: barra colapsada (input + ⚙ + Buscar) → panel expandible
// inline con fechas y selects → chips de filtros activos.
// Maneja su propio estado interno; avisa al padre vía onBuscar().
// ================================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import './MovimientosPage.css'

// ════════════════════════════════════════════
//  CONSTANTES
// ════════════════════════════════════════════

const TIPO_MOV_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'COMPRA', label: 'Compra' },
  { value: 'VENTA', label: 'Venta' },
  { value: 'PRODUCCION', label: 'Producción' },
  { value: 'AJUSTE', label: 'Ajuste' },
  { value: 'ANULACION_VENTA', label: 'Venta anulada' },
]

const TIPO_SUMINISTRO_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'PRODUCTO', label: 'Producto' },
  { value: 'MATERIAL', label: 'Material' },
]

/** Labels amigables para los filtros (usados en chips) */
const FILTRO_LABELS = {
  nombre: (v) => `nombre: ${v}`,
  usuario: (v) => `usuario: ${v}`,
  tipo_mov: (v) => TIPO_MOV_OPTS.find((o) => o.value === v)?.label || v,
  tipo_suministro: (v) => TIPO_SUMINISTRO_OPTS.find((o) => o.value === v)?.label || v,
  fecha_desde: (v) => `desde: ${v?.split('-').reverse().join('/') || v}`,
  fecha_hasta: (v) => `hasta: ${v?.split('-').reverse().join('/') || v}`,
}

/** Nombres display por campo */
const CAMPO_NOMBRE = {
  nombre: 'Nombre del suministro',
  usuario: 'Usuario',
  tipo_mov: 'Movimiento',
  tipo_suministro: 'Suministro',
  fecha_desde: 'Fecha desde',
  fecha_hasta: 'Fecha hasta',
}

// ════════════════════════════════════════════
//  COMPONENTE
// ════════════════════════════════════════════

/**
 * FiltrosMovimientos — Barra de búsqueda + panel desplegable + chips
 *
 * @param {Object}   props
 * @param {Function} props.onBuscar   - Callback con filtros actuales al buscar/limpiar chip
 * @param {boolean}  props.cargando   - Deshabilita botón y muestra spinner
 */
const MovimientosFilters = ({ onBuscar, cargando }) => {
  // ── Estado interno ──
  const [filtros, setFiltros] = useState({
    nombre: '',
    usuario: '',
    fecha_desde: '',
    fecha_hasta: '',
    tipo_suministro: '',
    tipo_mov: '',
  })
  const [expandido, setExpandido] = useState(false)

  // Ref para evitar stale closures en handleBuscar
  const filtrosRef = useRef(filtros)
  useEffect(() => { filtrosRef.current = filtros }, [filtros])

  // ── Conteo de filtros activos (excluyendo búsqueda por texto) ──
  const filtrosActivos = useMemo(() => {
    let count = 0
    if (filtros.fecha_desde) count++
    if (filtros.fecha_hasta) count++
    if (filtros.tipo_suministro) count++
    if (filtros.tipo_mov) count++
    return count
  }, [filtros])

  // ── Lista de chips a mostrar ──
  const chips = useMemo(() => {
    const result = []
    if (filtros.nombre?.trim()) result.push({ campo: 'nombre', valor: filtros.nombre.trim() })
    if (filtros.usuario?.trim()) result.push({ campo: 'usuario', valor: filtros.usuario.trim() })
    if (filtros.tipo_mov) result.push({ campo: 'tipo_mov', valor: filtros.tipo_mov })
    if (filtros.tipo_suministro) result.push({ campo: 'tipo_suministro', valor: filtros.tipo_suministro })
    if (filtros.fecha_desde) result.push({ campo: 'fecha_desde', valor: filtros.fecha_desde })
    if (filtros.fecha_hasta) result.push({ campo: 'fecha_hasta', valor: filtros.fecha_hasta })
    return result
  }, [filtros])

  // ── Actualizar un campo ──
  const actualizarCampo = useCallback((campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }, [])

  // ── Buscar: notifica al padre (usa ref para evitar closures stale) ──
  const handleBuscar = useCallback(() => {
    const actual = filtrosRef.current
    const limpios = {
      ...actual,
      nombre: actual.nombre.trim(),
      usuario: actual.usuario.trim(),
    }
    onBuscar(limpios)
  }, [onBuscar])

  // ── Limpiar todo: resetea, colapsa y busca sin filtros ──
  const handleLimpiarTodo = useCallback(() => {
    setFiltros({
      nombre: '',
      usuario: '',
      fecha_desde: '',
      fecha_hasta: '',
      tipo_suministro: '',
      tipo_mov: '',
    })
    setExpandido(false)
    onBuscar({})
  }, [onBuscar])

  // ── Quitar un chip específico ──
  const handleQuitarChip = useCallback((campo) => {
    setFiltros((prev) => {
      const next = { ...prev, [campo]: '' }
      onBuscar(next)
      return next
    })
  }, [onBuscar])

  // ── Enter en inputs de texto ──
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleBuscar()
    }
  }, [handleBuscar])

  // ── Enter en input de nombre ──
  const handleKeyDownNombre = useCallback((e) => {
    if (e.key === 'Enter') {
      handleBuscar()
    }
  }, [handleBuscar])

  // ── Toggle panel ──
  const togglePanel = useCallback(() => {
    setExpandido((prev) => !prev)
  }, [])

  return (
    <>
      {/* ═══════════════════════════════════════
          TARJETA DE FILTROS
          ═══════════════════════════════════════ */}
      <div className="mf-card">
        {/* ── Barra superior siempre visible ── */}
        <div className="mf-bar">
          {/* Input de búsqueda por nombre del suministro */}
          <div className="mf-search-wrap">
            <i className="ti ti-search mf-search-icon" />
            <input
              type="text"
              className="mf-search-input"
              placeholder="Buscar por nombre..."
              value={filtros.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              onKeyDown={handleKeyDownNombre}
              maxLength={100}
            />
            {filtros.nombre && (
              <button
                className="mf-search-clear"
                onClick={() => actualizarCampo('nombre', '')}
                tabIndex={-1}
                type="button"
              >
                <i className="ti ti-x" />
              </button>
            )}
          </div>

          {/* Botón ⚙ Filtros con badge */}
          <button
            className={`mf-btn-filtros ${expandido ? 'mf-btn-filtros--active' : ''}`}
            onClick={togglePanel}
            type="button"
          >
            <i className="ti ti-adjustments-horizontal" />
            Filtros
            {filtrosActivos > 0 && (
              <span className="mf-badge">{filtrosActivos}</span>
            )}
          </button>

          {/* Botón Buscar */}
          <button
            className="mf-btn-buscar"
            onClick={handleBuscar}
            disabled={cargando}
            type="button"
          >
            {cargando ? (
              <i className="ti ti-loader ti-spin" />
            ) : (
              <i className="ti ti-search" />
            )}
            Buscar
          </button>
        </div>

        {/* ── Panel expandible ── */}
        <div className={`mf-panel ${expandido ? 'mf-panel--open' : ''}`}>
          <div className="mf-panel-inner">
            <div className="mf-panel-grid">
              {/* Usuario */}
              <div className="mf-field">
                <label className="mf-label">
                  <i className="ti ti-user" /> Usuario
                </label>
                <input
                  type="text"
                  className="mf-input"
                  placeholder="Buscar por usuario..."
                  value={filtros.usuario}
                  onChange={(e) => actualizarCampo('usuario', e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={60}
                />
              </div>

              {/* Fecha desde */}
              <div className="mf-field">
                <label className="mf-label">
                  <i className="ti ti-calendar-due" /> Fecha desde
                </label>
                <input
                  type="date"
                  className="mf-input mf-input--date"
                  value={filtros.fecha_desde}
                  onChange={(e) => actualizarCampo('fecha_desde', e.target.value)}
                />
              </div>

              {/* Fecha hasta */}
              <div className="mf-field">
                <label className="mf-label">
                  <i className="ti ti-calendar-due" /> Fecha hasta
                </label>
                <input
                  type="date"
                  className="mf-input mf-input--date"
                  value={filtros.fecha_hasta}
                  onChange={(e) => actualizarCampo('fecha_hasta', e.target.value)}
                />
              </div>

              {/* Tipo suministro */}
              <div className="mf-field">
                <label className="mf-label">
                  <i className="ti ti-box" /> Tipo suministro
                </label>
                <select
                  className="mf-input"
                  value={filtros.tipo_suministro}
                  onChange={(e) => actualizarCampo('tipo_suministro', e.target.value)}
                >
                  {TIPO_SUMINISTRO_OPTS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Tipo movimiento */}
              <div className="mf-field">
                <label className="mf-label">
                  <i className="ti ti-arrows-shuffle" /> Tipo movimiento
                </label>
                <select
                  className="mf-input"
                  value={filtros.tipo_mov}
                  onChange={(e) => actualizarCampo('tipo_mov', e.target.value)}
                >
                  {TIPO_MOV_OPTS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón limpiar (solo visible si hay filtros activos) */}
            {filtrosActivos > 0 && (
              <div className="mf-panel-footer">
                <button
                  className="mf-btn-limpiar"
                  onClick={handleLimpiarTodo}
                  type="button"
                >
                  <i className="ti ti-x" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CHIPS DE FILTROS ACTIVOS
          ═══════════════════════════════════════ */}
      {chips.length > 0 && (
        <div className="mf-chips">
          {chips.map((chip) => {
            const labelFn = FILTRO_LABELS[chip.campo]
            const label = labelFn ? labelFn(chip.valor) : chip.valor
            return (
              <span key={chip.campo} className="mf-chip">
                <span className="mf-chip-label">{label}</span>
                <button
                  className="mf-chip-x"
                  onClick={() => handleQuitarChip(chip.campo)}
                  type="button"
                  aria-label={`Quitar filtro ${CAMPO_NOMBRE[chip.campo] || chip.campo}`}
                >
                  <i className="ti ti-x" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </>
  )
}

export default MovimientosFilters
