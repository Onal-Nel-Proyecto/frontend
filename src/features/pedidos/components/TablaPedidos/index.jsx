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
  FiX
} from 'react-icons/fi';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { usePedidosTable } from '../../hooks/usePedidosTable';
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

// ─── Componente principal ───
const TablaPedidos = () => {
  const navigate = useNavigate();

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
  } = usePedidosTable();

  const handleCancelConfirm = confirmarCancelacion;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input type="text" placeholder="Buscar por cliente o pedido..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200}/>
          </div>
          <button className={`${styles.filterBtn} ${filtrosActivos ? styles.filterActive : ''}`} onClick={() => setShowFiltros(true)}>
            <FiFilter /> Filtrar{filtrosActivos ? ` (${Object.values(filtrosActivos).filter(Boolean).length})` : ''}
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
                <option value="CAMISA">Camisa</option>
                <option value="CAMISETA">Camiseta</option>
                <option value="POLO">Polo</option>
                <option value="PANTALON">Pantalón</option>
                <option value="JEAN">Jean</option>
                <option value="BERMUDA">Bermuda</option>
                <option value="SHORT">Short</option>
                <option value="FALDA">Falda</option>
                <option value="VESTIDO">Vestido</option>
                <option value="CHAQUETA">Chaqueta</option>
                <option value="BUSO">Buso</option>
                <option value="SUDADERA">Sudadera</option>
                <option value="HOODIE">Hoodie</option>
                <option value="OVEROL">Overol</option>
                <option value="DELANTAL">Delantal</option>
                <option value="UNIFORME">Uniforme</option>
                <option value="DOTACION">Dotación</option>
                <option value="GORRA">Gorra</option>
                <option value="OTRO">Otro</option>
              </select>

              <label className={styles.filterLabel}>Estado del pedido</label>
              <select
                className={styles.filterInput}
                value={filtros.estado}
                onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="TERMINADO">Terminado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>

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

              <label className={styles.filterLabel}>Fecha estimada de entrega</label>
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
                  setFiltros({ fecha_desde: '', fecha_hasta: '', tipo_pedido: '', tipo_prenda: '', estado_pago: '', fecha_entrega_desde: '', fecha_entrega_hasta: '' });
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

      {/* Tabla */}
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Listado de pedidos">
          <thead>
            <tr>
              <th>ID</th>
              <th>CLIENTE</th>
              <th>DESCRIPCIÓN</th>
              <th>FECHA ENTREGA</th>
              <th>ESTADO DE PAGO</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingText}>Cargando pedidos…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.loadingText}>No se encontraron pedidos</td></tr>
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
                  <tr key={row.id} className={styles.clickableRow} onClick={() => navigate(`/pedidos/${row.id}`)}>
                    <td className={styles.cellId}>{row.id}</td>
                    <td className={styles.cellClient}>{row.cliente_nombres}</td>
                    <td className={styles.cellDesc}>{row.descripcion || '—'}</td>
                    <td className={`${styles.cellDelivery} ${diasClass ? styles[diasClass] : ''}`}>{fecha}</td>
                    <td className={styles.cellDesc}>{row.estado_pago || '—'}</td>
                    <td><span className={`${styles.badge} ${styles[st.className] || ''}`}>{st.label || row.estado}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <AccionesMenu
                        pedidoId={row.id}
                        estado={row.estado}
                        onVer={() => navigate(`/pedidos/${row.id}`)}
                        onCancelar={() => iniciarCancelacion(row.id)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Vista móvil */}
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
                <div key={row.id} className={styles.mobileCard} onClick={() => navigate(`/pedidos/${row.id}`)}>
                  <div className={styles.mobileHeader}>
                    <span className={styles.cellId}>{row.id}</span>
                    <span className={`${styles.badge} ${styles[st.className] || ''}`}>{st.label || row.estado}</span>
                  </div>
                  <p className={styles.mobileClient}>{row.cliente_nombres}</p>
                  <p className={styles.mobileDesc}>{row.descripcion || '—'}</p>
                  <div className={styles.mobileFooter}>
                    <span className={diasClass ? styles[diasClass] : ''}>{fecha}</span>
                    <span className={styles.estadoPagoMobile}>{row.estado_pago || '—'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
