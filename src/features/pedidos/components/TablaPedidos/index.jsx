// ================================================================
// TablaPedidos — Tabla del listado completo de pedidos
// ================================================================

import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from 'react-icons/fi';
import { formatCurrency } from '../../../../utils/format';
import { getCategorias } from '../../../../services/categoriaService';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { usePedidosTable } from '../../hooks/usePedidosTable';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';
import styles from './TablaPedidos.module.css';

const statusMap = {
  PENDIENTE:  { label: 'Pendiente',  className: 'pending' },
  "EN PROCESO": { label: 'En proceso', className: 'inProcess' },
  TERMINADO:  { label: 'Terminado',  className: 'delivered' },
  ENTREGADO:  { label: 'Entregado',  className: 'delivered' },
  CANCELADO:  { label: 'Cancelado',  className: 'delayed' },
};

// ─── Menú de acciones por fila (portal a body para evitar recorte por overflow) ───
const AccionesMenu = memo(({ pedidoId, estado, onVer, onCancelar }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // NOTA: el menú se cierra con click fuera (mousedown listener arriba).
  // Ya no hay listener de scroll — el portal repositioning (coords check) ya protege
  // contra desalineación, y quitar el scroll listener reduce trabajo en scroll.

  // Ajustar posición después de renderizar el menú (por si la estimación falló)
  useEffect(() => {
    if (!open || !menuRef.current || !coords) return;
    const rect = menuRef.current.getBoundingClientRect();
    const menuH = rect.height;
    let { top, left } = coords;

    // Si se sale por abajo, invertir
    if (rect.bottom > window.innerHeight - 8) {
      const btnRect = btnRef.current?.getBoundingClientRect();
      top = btnRect ? btnRect.top - menuH - 4 : top - menuH - 4;
    }
    // Si se sale por arriba, poner abajo
    if (top < 8) {
      const btnRect = btnRef.current?.getBoundingClientRect();
      top = btnRect ? btnRect.bottom + 4 : 8;
    }
    // No salirse por la derecha
    if (rect.right > window.innerWidth - 8) {
      const btnRect = btnRef.current?.getBoundingClientRect();
      left = btnRect ? btnRect.right - 150 : left;
    }
    // No salirse por la izquierda
    if (left < 8) left = 8;

    if (top !== coords.top || left !== coords.left) {
      setCoords({ top, left });
    }
  }, [open, coords]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 150;
      let left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      if (left < 8) left = 8;

      // Estimar espacio: abajo si hay ~130px, sino arriba
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedMenuH = 120;
      const top = spaceBelow >= estimatedMenuH
        ? rect.bottom + 4
        : rect.top - estimatedMenuH - 4;

      setCoords({ top, left });
    }
    setOpen((o) => !o);
  };

  const puedeCancelar = !['ENTREGADO', 'TERMINADO', 'CANCELADO'].includes(estado?.toUpperCase());

  return (
    <div className={styles.actionsWrapper} ref={btnRef}>
      <button className={styles.actionBtn} onClick={handleToggle} aria-label="Acciones del pedido">
        <FiMoreVertical />
      </button>
      {open && coords && createPortal(
        <div
          ref={menuRef}
          className={styles.actionsMenuPortal}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 1050,
          }}
        >
          <button className={styles.actionItem} onClick={() => { setOpen(false); onVer(); }} aria-label="Ver detalle del pedido">
            <FiEye /> Ver
          </button>
          <button className={styles.actionItem} disabled={!puedeCancelar} onClick={() => { setOpen(false); onCancelar(); }} aria-label="Cancelar pedido">
            <FiXCircle /> Cancelar
          </button>
        </div>,
        document.body
      )}
    </div>
  );
});

// ─── Configuración de columnas según origen ───
const COLUMNS = {
  CLIENTE: [
    { key: 'id',        label: 'ID' },
    { key: 'cliente',   label: 'CLIENTE' },
    { key: 'descripcion', label: 'DESCRIPCIÓN' },
    { key: 'tipo',      label: 'TIPO' },
    { key: 'precio',    label: 'PRECIO TOTAL' },
    { key: 'fecha_entrega', label: 'FECHA ENTREGA' },
    { key: 'estado_pago', label: 'ESTADO DE PAGO' },
    { key: 'estado',    label: 'ESTADO' },
    { key: 'acciones',  label: '' },
  ],
  PRODUCCION: [
    { key: 'id',        label: 'ID' },
    { key: 'descripcion', label: 'DESCRIPCIÓN' },
    { key: 'observacion', label: 'OBSERVACIÓN' },
    { key: 'estado',    label: 'ESTADO' },
    { key: 'fecha_fin', label: 'FECHA ESTIMADA FINALIZACIÓN' },
    { key: 'fecha_ingreso', label: 'FECHA REGISTRO' },
    { key: 'acciones',  label: '' },
  ],
};

// ─── Componente principal ───
const TablaPedidos = ({ origen = 'CLIENTE' }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isProduccion = origen === 'PRODUCCION';

  const {
    pedidos,
    loading,
    pagAct,
    maxPag,
    search,
    setSearch,
    setPagAct,
    filtros,
    setFiltros,
    filtrosActivos,
    setFiltrosActivos,
    showFiltros,
    setShowFiltros,
    filtered,
    pageNumbers,
    // Cancelación
    cancelTarget,
    cancelMotivo,
    cancelLoading,
    cancelResult,
    iniciarCancelacion,
    setCancelMotivo,
    confirmarCancelacion,
    cancelarDialogo,
  } = usePedidosTable({ origen });

  // ── Cargar tipos de prenda desde categorías ──
  const [tiposPrenda, setTiposPrenda] = useState([]);

  useEffect(() => {
    let cancel = false;
    const fetchTipos = async () => {
      try {
        const result = await getCategorias(1, {});
        if (cancel) return;
        const cats = result.data || [];
        // Extraer todos los tipos de prenda y deduplicar
        const tipos = cats.flatMap((cat) => {
          const tips = cat.catTipsPrendas || cat.categoria_tipo_prenda || [];
          return Array.isArray(tips) ? tips : [];
        });
        const unicos = [...new Set(tipos)].sort();
        setTiposPrenda(unicos);
      } catch {
        if (!cancel) setTiposPrenda([]);
      }
    };
    fetchTipos();
    return () => { cancel = true; };
  }, []);

  const columns = COLUMNS[origen] || COLUMNS.CLIENTE;
  const basePath = isProduccion ? '/pedidos/orden-produccion' : '/pedidos';

  const handleCancelConfirm = confirmarCancelacion;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input type="text" placeholder={isProduccion ? "Buscar por pedido…" : "Buscar por cliente o pedido..."} className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200}/>
          </div>
          <button className={`${styles.filterBtn} ${filtrosActivos && Object.entries(filtrosActivos).filter(([k,v]) => v && !(k === 'estado' && v === 'pendiente,en proceso')).length > 0 ? styles.filterActive : ''}`} onClick={() => setShowFiltros(true)}>
            <FiFilter /> Filtrar{filtrosActivos && Object.entries(filtrosActivos).filter(([k,v]) => v && !(k === 'estado' && v === 'pendiente,en proceso')).length > 0 ? ` (${Object.entries(filtrosActivos).filter(([k,v]) => v && !(k === 'estado' && v === 'pendiente,en proceso')).length})` : ''}
          </button>
        </div>
      </div>

      {/* ─── Panel de filtros ─── */}
      {showFiltros && (
        <div className={styles.filterOverlay} onClick={() => setShowFiltros(false)}>
          <div className={styles.filterPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>Filtros</h3>
              <button className={styles.filterClose} onClick={() => setShowFiltros(false)} aria-label="Cerrar filtros">
                <FiX />
              </button>
            </div>

            <div className={styles.filterBody}>
              <label className={styles.filterLabel}>Fecha de registro</label>
              <div className={styles.filterDateRow}>
                <div className={styles.filterDateField}>
                  <span className={styles.filterDateSub}>Desde</span>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={filtros.fecha_desde}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_desde: e.target.value }))}
                  />
                </div>
                <div className={styles.filterDateField}>
                  <span className={styles.filterDateSub}>Hasta</span>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={filtros.fecha_hasta}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_hasta: e.target.value }))}
                  />
                </div>
              </div>

              {!isProduccion && (
                <>
                  <label className={styles.filterLabel}>Tipo de pedido</label>
                  <select
                    className={styles.filterInput}
                    value={filtros.tipo_pedido}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, tipo_pedido: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="personalizado">Personalizado</option>
                    <option value="retoques">Retoques</option>
                    <option value="modificaciones">Modificaciones</option>
                  </select>

                  <label className={styles.filterLabel}>Tipo de prenda</label>
                  <select
                    className={styles.filterInput}
                    value={filtros.tipo_prenda}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, tipo_prenda: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    {tiposPrenda.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className={styles.filterLabel}>Estado del pedido</label>
              <select
                className={styles.filterInput}
                value={filtros.estado}
                onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
              >
                {isProduccion ? (
                  <>
                    <option value="">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN PROCESO">En proceso</option>
                    <option value="TERMINADO">Terminado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </>
                ) : (
                  <>
                    <option value="pendiente,en proceso">Por defecto</option>
                    <option value="todos">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN PROCESO">En proceso</option>
                    <option value="TERMINADO">Terminado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </>
                )}
              </select>

              {!isProduccion && (
                <>
                  <label className={styles.filterLabel}>Estado de pago</label>
                  <select
                    className={styles.filterInput}
                    value={filtros.estado_pago}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, estado_pago: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="SIN PAGAR">Sin pagar</option>
                    <option value="ABONADO">Abonado</option>
                    <option value="PAGADO">Pagado</option>
                  </select>
                </>
              )}

              <label className={styles.filterLabel}>
                {isProduccion ? 'Fecha estimada de finalización' : 'Fecha estimada de entrega'}
              </label>
              <div className={styles.filterDateRow}>
                <div className={styles.filterDateField}>
                  <span className={styles.filterDateSub}>Desde</span>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={filtros.fecha_entrega_desde}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_entrega_desde: e.target.value }))}
                  />
                </div>
                <div className={styles.filterDateField}>
                  <span className={styles.filterDateSub}>Hasta</span>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={filtros.fecha_entrega_hasta}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_entrega_hasta: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterFooter}>
              <button
                className={styles.filterClearBtn}
                onClick={() => {
                  const limpios = { fecha_desde: '', fecha_hasta: '', fecha_entrega_desde: '', fecha_entrega_hasta: '' };
                  if (!isProduccion) {
                    limpios.tipo_pedido = '';
                    limpios.tipo_prenda = '';
                    limpios.estado_pago = '';
                  }
                  setFiltros(limpios);
                  setFiltrosActivos(null);
                  setPagAct(1);
                  setShowFiltros(false);
                }}
              >
                Limpiar filtros
              </button>
              <button
                className={styles.filterApplyBtn}
                onClick={() => {
                  setFiltrosActivos({ ...filtros });
                  setPagAct(1);
                  setShowFiltros(false);
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla — desktop */}
      {!isMobile && (
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Listado de pedidos">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className={styles.loadingText}>Cargando pedidos…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className={styles.loadingText}>No se encontraron pedidos</td></tr>
            ) : (
              filtered.map((row) => {
                const st = statusMap[row.estado?.toUpperCase()] || {};
                const fecha = row.fecha_entrega_estimada || '—';
                const df = row.dias_faltantes;
                let diasClass = '';
                if (df !== null && df !== undefined) {
                  if (df <= 0) diasClass = 'diasRojo';
                  else if (df <= 3) diasClass = 'diasAmarillo';
                }
                return (
                  <tr key={row.id} className={styles.clickableRow} onClick={() => navigate(`${basePath}/${row.id}`)}>
                    {isProduccion ? (
                      <>
                        <td className={styles.cellId}>{row.id}</td>
                        <td className={styles.cellDesc}><span className={styles.cellTruncate}>{row.descripcion || '—'}</span></td>
                        <td className={styles.cellDesc}><span className={styles.cellTruncate}>{row.observacion || '—'}</span></td>
                        <td><span className={`${styles.badge} ${styles[st.className] || ''}`}>{st.label || row.estado}</span></td>
                        <td className={styles.cellDelivery}>{fecha}</td>
                        <td className={styles.cellDelivery}>{row.fecha_ingreso || '—'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <AccionesMenu
                            pedidoId={row.id}
                            estado={row.estado}
                            onVer={() => navigate(`${basePath}/${row.id}`)}
                            onCancelar={() => iniciarCancelacion(row.id)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={styles.cellId}>{row.id}</td>
                        <td className={styles.cellClient}>{row.cliente_nombres}</td>
                        <td className={styles.cellDesc}>{row.descripcion || '—'}</td>
                        <td className={styles.cellTipo}>{row.tipo_pedido ? row.tipo_pedido.charAt(0).toUpperCase() + row.tipo_pedido.slice(1) : '—'}</td>
                        <td className={styles.cellPrice}>{formatCurrency(row.precio_total)}</td>
                        <td className={`${styles.cellDelivery} ${diasClass ? styles[diasClass] : ''}`}>{fecha}</td>
                        <td className={styles.cellDesc}>{row.estado_pago || '—'}</td>
                        <td><span className={`${styles.badge} ${styles[st.className] || ''}`}>{st.label || row.estado}</span></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <AccionesMenu
                            pedidoId={row.id}
                            estado={row.estado}
                            onVer={() => navigate(`${basePath}/${row.id}`)}
                            onCancelar={() => iniciarCancelacion(row.id)}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>)}

      {/* Vista móvil */}
      {isMobile && (
      <div className={styles.mobileList}>
          {loading ? (
            <p className={styles.loadingText}>Cargando pedidos…</p>
          ) : filtered.length === 0 ? (
            <p className={styles.loadingText}>No se encontraron pedidos</p>
          ) : (
            filtered.map((row) => {
              const st = statusMap[row.estado?.toUpperCase()] || {};
              const fecha = row.fecha_entrega_estimada || '—';
              const df = row.dias_faltantes;
              let diasClass = '';
              if (df !== null && df !== undefined) {
                if (df <= 0) diasClass = 'diasRojo';
                else if (df <= 3) diasClass = 'diasAmarillo';
              }
              return (
                <div key={row.id} className={styles.mobileCard} onClick={() => navigate(`${basePath}/${row.id}`)}>
                  <div className={styles.mobileHeader}>
                    <span className={styles.cellId}>{row.id}</span>
                    <span className={`${styles.badge} ${styles[st.className] || ''}`}>{st.label || row.estado}</span>
                  </div>
                  {!isProduccion && <p className={styles.mobileClient}>{row.cliente_nombres}</p>}
                  <p className={`${styles.mobileDesc} ${styles.cellTruncate}`} style={{ maxWidth: '100%' }}>{row.descripcion || '—'}</p>
                  {isProduccion && <p className={`${styles.mobileDesc}`} style={{ opacity: 0.7 }}>Obs: {row.observacion || '—'}</p>}
                  {!isProduccion && <p className={styles.mobileTipo}>{row.tipo_pedido ? row.tipo_pedido.charAt(0).toUpperCase() + row.tipo_pedido.slice(1) : '—'}</p>}
                  {!isProduccion && <p className={styles.mobilePrice}>{formatCurrency(row.precio_total)}</p>}
                  <div className={styles.mobileFooter}>
                    <span className={diasClass ? styles[diasClass] : ''}>{fecha}</span>
                    {!isProduccion && <span className={styles.estadoPagoMobile}>{row.estado_pago || '—'}</span>}
                    {isProduccion && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reg: {row.fecha_ingreso || '—'}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>)}

      {/* Paginación (derecha, inteligente) */}
      {maxPag > 1 && (
        <div className={styles.footer}>
          <div className={styles.pagination}>
            <FiChevronLeft
              className={`${styles.pageArrow} ${pagAct <= 1 ? styles.pageArrowDisabled : ''}`}
              onClick={() => pagAct > 1 && setPagAct((p) => p - 1)}
              role="button"
              tabIndex={0}
              aria-label="Página anterior"
              onKeyDown={(e) => e.key === 'Enter' && pagAct > 1 && setPagAct((p) => p - 1)}
            />
            {pageNumbers.map((n, i) =>
              n === '...' ? (
                <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
              ) : (
                <span
                  key={n}
                  className={n === pagAct ? styles.pageActive : ''}
                  onClick={() => setPagAct(n)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ir a página ${n}${n === pagAct ? ' — página actual' : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && setPagAct(n)}
                >{n}</span>
              )
            )}
            <FiChevronRight
              className={`${styles.pageArrow} ${pagAct >= maxPag ? styles.pageArrowDisabled : ''}`}
              onClick={() => pagAct < maxPag && setPagAct((p) => p + 1)}
              role="button"
              tabIndex={0}
              aria-label="Página siguiente"
              onKeyDown={(e) => e.key === 'Enter' && pagAct < maxPag && setPagAct((p) => p + 1)}
            />
          </div>
        </div>
      )}

      {/* Confirmación cancelar */}
      {cancelTarget && (
        <Alert
          type="confirm"
          title="¿Cancelar pedido?"
          message="Ingresa el motivo de cancelación:"
          onCancel={cancelarDialogo}
          onConfirm={handleCancelConfirm}
        >
          <textarea
            className={styles.cancelInput}
            placeholder="Motivo de cancelación…"
            value={cancelMotivo}
            onChange={(e) => setCancelMotivo(e.target.value)}
            rows={3}
            required
          />
        </Alert>
      )}

      {cancelLoading && <LoadingOverlay title="Cancelando pedido…" message="Procesando la solicitud" />}
      {cancelResult && <Alert type={cancelResult.type} title={cancelResult.title} message={cancelResult.message} onClose={cancelResult.onClose} />}
    </div>
  );
};

export default memo(TablaPedidos);
