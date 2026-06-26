// ================================================================
// Entregas — Página de historial de pedidos entregados/terminados
// Obtiene datos desde GET /pedidos/entregas con filtros por query params.
// Muestra dashboard con indicadores, tabla filtrable y modal de detalle.
// Filtros: botón "Filtrar" que abre panel lateral.
// Vista responsive: cards en móvil, tabla en desktop/tablet.
// ================================================================

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPackage, FiCheckCircle, FiCheck, FiTrendingUp, FiSearch, FiFilter, FiEye, FiExternalLink, FiChevronLeft, FiChevronRight, FiX, FiRotateCcw, FiBox, FiTool } from 'react-icons/fi';
import { GiTakeMyMoney } from 'react-icons/gi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import Card from '../../../../components/common/Card';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { getEntregas, getEntregaById, getPagosByVenta, entregarPedido, devolverPedido } from '../../services/pedidosService';
import EntregasModal from '../../components/EntregasModal';
import { formatCurrency } from '../../../../utils/format';
import styles from './entregas.module.css';

// ─── HELPERS ──────────────────────────────────────────────────

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const statusPayment = {
  'PAGADO': { label: 'Pagado', className: 'paid' },
  'ABONADO': { label: 'Abonado', className: 'partial' },
  'SIN PAGAR': { label: 'Sin pagar', className: 'unpaid' },
};

const statusOrder = {
  'ENTREGADO': { label: 'Entregado', className: 'delivered' },
  'TERMINADO': { label: 'Terminado', className: 'finished' },
};

/**
 * Calcula los números de página a mostrar con inteligencia:
 * - Siempre muestra la primera y última página.
 * - Muestra la página actual y sus vecinos inmediatos.
 * - Cuando hay más de 5 páginas inserta "..." donde corresponda.
 */
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 2) end = 3;
  if (current >= total - 1) start = total - 2;

  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');

  pages.push(total);
  return pages;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────

const Entregas = () => {
  useDocumentTitle('Entregas');
  const navigate = useNavigate();

  // ─── Estados de datos ───
  const [entregas, setEntregas] = useState([]);
  const [resumen, setResumen] = useState({ totalEntregados: 0, totalTerminados: 0, valorTotal: 0, saldoPendiente: 0 });
  const [maxPag, setMaxPag] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Paginación y modales ───
  const [pagina, setPagina] = useState(() => {
    const p = parseInt(searchParams.get('pagina'), 10);
    return p >= 1 ? p : 1;
  });
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // ─── Búsqueda con debounce ───
  const searchFromUrl = searchParams.get('busqueda') || '';
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPagina(1);
    }, 400);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ─── Filtros del panel ───
  const [filtros, setFiltros] = useState(() => ({
    estado: searchParams.get('estado') || '',
    mes: searchParams.get('mes') || '',
    fecha_desde: searchParams.get('fecha_desde') || '',
    fecha_hasta: searchParams.get('fecha_hasta') || '',
  }));
  const [filtrosActivos, setFiltrosActivos] = useState(() => {
    const keys = ['estado', 'mes', 'fecha_desde', 'fecha_hasta'];
    const params = {};
    let hasAny = false;
    for (const key of keys) {
      const val = searchParams.get(key);
      if (val) {
        params[key] = val;
        hasAny = true;
      }
    }
    return hasAny ? params : null;
  });
  const [showFiltros, setShowFiltros] = useState(false);

  // ─── Confirmación de entrega ───
  const [deliverTarget, setDeliverTarget] = useState(null);
  const [deliverObservacion, setDeliverObservacion] = useState('');
  const [deliverLoading, setDeliverLoading] = useState(false);
  const [deliverResult, setDeliverResult] = useState(null);

  // ─── Devolución ───
  const [devolucionTarget, setDevolucionTarget] = useState(null);
  const [devolucionConfirm, setDevolucionConfirm] = useState(null); // { tipo, entrega }
  const [devolucionMotivo, setDevolucionMotivo] = useState('');
  const [devolucionMotivoError, setDevolucionMotivoError] = useState('');
  const [devolucionLoading, setDevolucionLoading] = useState(false);
  const [devolucionResult, setDevolucionResult] = useState(null);

  // ─── Carga de datos desde la API ───
  useEffect(() => {
    let cancel = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { pag: pagina };
        if (searchQuery.trim()) params.cliente = searchQuery.trim();
        if (filtrosActivos?.estado) params.estado = filtrosActivos.estado;
        if (filtrosActivos?.mes) params.mes = filtrosActivos.mes;
        if (filtrosActivos?.fecha_desde) params.fecha_desde = filtrosActivos.fecha_desde;
        if (filtrosActivos?.fecha_hasta) params.fecha_hasta = filtrosActivos.fecha_hasta;

        const resp = await getEntregas(params);
        if (cancel) return;

        setEntregas(resp.data || []);
        setMaxPag(resp.maxPag || 1);
        if (resp.resumen) setResumen(resp.resumen);
      } catch (err) {
        if (cancel) return;
        setError(err?.response?.data?.error || 'Error al cargar las entregas');
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetch();
    return () => { cancel = true; };
  }, [pagina, searchQuery, filtrosActivos]);

  // ─── Sincronizar estado a la URL ───
  useEffect(() => {
    const params = new URLSearchParams();
    if (pagina > 1) params.set('pagina', String(pagina));
    if (searchQuery) params.set('busqueda', searchQuery);
    if (filtrosActivos) {
      Object.entries(filtrosActivos).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
    }
    setSearchParams(params, { replace: true });
  }, [pagina, searchQuery, filtrosActivos, setSearchParams]);

  // ─── Números de página para la paginación inteligente ───
  const pageNumbers = useMemo(() => getPageNumbers(pagina, maxPag), [pagina, maxPag]);

  // ─── Contar filtros activos ───
  const totalFiltrosActivos = filtrosActivos
    ? Object.values(filtrosActivos).filter(Boolean).length
    : 0;

  // ─── Abrir modal de detalle: items desde detalle del pedido, pagos desde endpoint propio ───
  const verDetalle = async (entrega) => {
    const id = entrega.id || entrega.pedido_id;
    const ventaId = entrega.venta_id;
    if (!id) return;

    setDetalleLoading(true);
    setShowModal(true);
    setSelectedEntrega(entrega);

    try {
      // 1. Items desde el detalle del pedido
      let items = [];
      const resp = await getEntregaById(id);
      const pedidoData = resp?.data || resp?.pedido || resp || {};
      const detallesRaw = pedidoData.detalles_pedido || pedidoData.detalles || [];

      if (detallesRaw.length > 0) {
        items = detallesRaw.map((d) => ({
          producto: d.producto?.nombre || d.producto || '—',
          cantidad: d.cantidad ?? 0,
          precio: d.producto?.precio ?? d.precio_unitario ?? 0,
        }));
      }

      // 2. Pagos desde endpoint propio (por venta_id o pedido_id)
      let pagos = [];
      try {
        const pagosResp = await getPagosByVenta({ venta_id: ventaId, pedido_id: ventaId ? undefined : id });
        // Extraer array de pagos desde distintas estructuras de respuesta
        let pagosRaw = [];
        if (Array.isArray(pagosResp)) {
          pagosRaw = pagosResp;
        } else if (Array.isArray(pagosResp?.data)) {
          pagosRaw = pagosResp.data;
        } else if (Array.isArray(pagosResp?.pagos)) {
          pagosRaw = pagosResp.pagos;
        } else if (pagosResp?.data?.pagos && Array.isArray(pagosResp.data.pagos)) {
          pagosRaw = pagosResp.data.pagos;
        }
        if (pagosRaw.length > 0) {
          pagos = pagosRaw.map((p) => ({
            fecha: (p.fecha || p.fecha_pago || p.createdAt || p.fecha_registro)
              ? new Date(p.fecha || p.fecha_pago || p.createdAt || p.fecha_registro).toLocaleDateString('es-CO')
              : '—',
            monto: Number(p.monto ?? p.monto_pagado ?? p.valor ?? 0),
            metodo: p.metodo || p.metodo_pago || '—',
            estado: p.estado || p.estado_pago || 'COMPLETADO',
          }));
        }
      } catch {
        // Si falla la carga de pagos, mostrar sin pagos
      }

      // 3. Calcular total pagado (solo COMPLETADO) y saldo pendiente
      const totalPagado = pagos
        .filter(p => (p.estado || 'COMPLETADO').toUpperCase() === 'COMPLETADO')
        .reduce((sum, p) => sum + Number(p.monto ?? 0), 0);

      setSelectedEntrega((prev) => {
        const totalPedido = pedidoData.precio_total ?? pedidoData.total ?? prev.total ?? 0;
        const saldoCalculado = Math.max(0, totalPedido - totalPagado);
        return {
          id: prev.id,
          estado: prev.estado,
          estado_pago: prev.estado_pago,
          venta_id: prev.venta_id,
          cliente_nombres: pedidoData.cliente_nombres || pedidoData.cliente?.cliente_nombres || prev.cliente_nombres || '—',
          fecha_entrega_estimada: pedidoData.fecha_entrega_estimada || prev.fecha_entrega_estimada || '—',
          fecha_entrega_real: pedidoData.fecha_entrega_real || prev.fecha_entrega_real || '—',
          items,
          pagos,
          total: totalPedido,
          saldo_pendiente: pedidoData.saldo ?? pedidoData.saldo_pendiente ?? saldoCalculado,
        };
      });
    } catch {
      // Si falla la carga completa, mostrar los datos que ya teníamos
    } finally {
      setDetalleLoading(false);
    }
  };

  // ─── Confirmar y marcar como entregado vía API ───
  const handleDeliverConfirm = async () => {
    if (!deliverTarget) return;
    const id = deliverTarget.id;
    const observacion = deliverObservacion.trim();
    setDeliverTarget(null);
    setDeliverObservacion('');
    setDeliverLoading(true);

    try {
      const resp = await entregarPedido(id, observacion ? { observacion } : {});
      setDeliverLoading(false);

      if (resp?.status) {
        // Actualizar localmente
        setEntregas((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, estado: 'ENTREGADO', fecha_entrega_real: new Date().toISOString().split('T')[0] }
              : e
          )
        );
        setResumen((prev) => ({
          ...prev,
          totalEntregados: (prev.totalEntregados || 0) + 1,
          totalTerminados: Math.max(0, (prev.totalTerminados || 0) - 1),
        }));
        setDeliverResult({
          type: 'success',
          title: 'Pedido entregado',
          message: resp.msg || `El pedido #${id} ha sido marcado como entregado.${observacion ? ` Observación: ${observacion}` : ''}`,
          onClose: () => setDeliverResult(null),
        });
      } else {
        setDeliverResult({
          type: 'error', title: 'Error',
          message: resp?.msg || 'Error al marcar el pedido como entregado',
          onClose: () => setDeliverResult(null),
        });
      }
    } catch (err) {
      setDeliverLoading(false);
      setDeliverResult({
        type: 'error', title: 'Error',
        message: err?.response?.data?.error || 'No se pudo marcar el pedido como entregado',
        onClose: () => setDeliverResult(null),
      });
    }
  };

  // ─── Limpiar filtros ───
  const limpiarFiltros = () => {
    setFiltros({ estado: '', mes: '', fecha_desde: '', fecha_hasta: '' });
    setFiltrosActivos(null);
    setPagina(1);
    setShowFiltros(false);
  };

  return (
    <div className={styles.page}>
      {/* ─── Encabezado ─── */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Entregas</h2>
          <p className={styles.subtitle}>Historial de pedidos entregados y terminados</p>
        </div>
        <button className={styles.btnNew} onClick={() => navigate('/pedidos', { state: { openForm: true } })}>
          <FiPackage className={styles.btnIcon} />
          Nuevo Pedido
        </button>
      </header>

      {/* ─── Dashboard de indicadores ─── */}
      <section className={styles.cardsGrid}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}><FiCheckCircle /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{resumen.totalEntregados}</span>
            <span className={styles.statLabel}>Entregados</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}><FiPackage /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{resumen.totalTerminados}</span>
            <span className={styles.statLabel}>Terminados</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}><GiTakeMyMoney /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{formatCurrency(resumen.saldoPendiente)}</span>
            <span className={styles.statLabel}>Saldo pendiente</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconTeal}`}><FiTrendingUp /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{formatCurrency(resumen.valorTotal)}</span>
            <span className={styles.statLabel}>Valor total</span>
          </div>
        </Card>
      </section>

      {/* ─── Barra de herramientas: búsqueda + botón filtrar ─── */}
      <Card className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por cliente o pedido..."
              value={searchInput}
              onChange={handleSearchChange}
              maxLength={200}
            />
          </div>
          <button
            className={`${styles.filterBtn} ${totalFiltrosActivos > 0 ? styles.filterActive : ''}`}
            onClick={() => setShowFiltros(true)}
          >
            <FiFilter /> Filtrar{totalFiltrosActivos > 0 ? ` (${totalFiltrosActivos})` : ''}
          </button>
        </div>
      </Card>

      {/* ─── Panel lateral de filtros ─── */}
      {showFiltros && (
        <div className={styles.filterOverlay} onClick={() => setShowFiltros(false)}>
          <div className={styles.filterPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>Filtros</h3>
              <button className={styles.filterClose} onClick={() => setShowFiltros(false)}>
                <FiX />
              </button>
            </div>

            <div className={styles.filterBody}>
              <label className={styles.filterLabel}>Estado del pedido</label>
              <select
                className={styles.filterInput}
                value={filtros.estado}
                onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="entregado">Entregado</option>
                <option value="terminado">Terminado</option>
              </select>

              <label className={styles.filterLabel}>Mes de entrega</label>
              <select
                className={styles.filterInput}
                value={filtros.mes}
                onChange={(e) => setFiltros((prev) => ({ ...prev, mes: e.target.value }))}
              >
                <option value="">Todos los meses</option>
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>

              <label className={styles.filterLabel}>Rango de fechas</label>
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
            </div>

            <div className={styles.filterFooter}>
              <button className={styles.filterClearBtn} onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
              <button
                className={styles.filterApplyBtn}
                onClick={() => {
                  setFiltrosActivos({ ...filtros });
                  setPagina(1);
                  setShowFiltros(false);
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tabla principal (escritorio/tablet) ─── */}
      <Card className={styles.tableCard}>
        {loading ? (
          <LoadingOverlay title="Cargando entregas…" message="Obteniendo historial" />
        ) : error ? (
          <p className={styles.loadingText}>{error}</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label="Historial de entregas">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Fecha estimada</th>
                    <th>Fecha de entrega</th>
                    <th className={styles.cellCurrencyHeader}>Total</th>
                    <th className={styles.cellCurrencyHeader}>Saldo pendiente</th>
                    <th>Estado de pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={styles.emptyRow}>
                        No se encontraron entregas con los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    entregas.map((entrega) => {
                      const sp = statusPayment[entrega.estado_pago] || {};
                      const so = statusOrder[entrega.estado] || {};
                      const idDisplay = entrega.id || entrega.pedido_id;
                      const clienteDisplay = entrega.cliente_nombres || entrega.cliente || '—';
                      const fechaEstimada = entrega.fecha_entrega_estimada || '—';
                      const fechaReal = entrega.fecha_entrega_real || '—';
                      const total = entrega.precio_total ?? entrega.total ?? 0;
                      const saldo = entrega.saldo ?? entrega.saldo_pendiente ?? 0;
                      return (
                        <tr key={idDisplay} className={styles.tableRow}>
                          <td className={styles.cellId}>#{idDisplay}</td>
                          <td className={styles.cellClient} title={clienteDisplay !== '—' ? clienteDisplay : ''}>{clienteDisplay}</td>
                          <td>{fechaEstimada}</td>
                          <td>{fechaReal}</td>
                          <td className={styles.cellCurrency}>{formatCurrency(total)}</td>
                          <td className={`${styles.cellCurrency} ${saldo > 0 ? styles.cellDanger : ''}`}>
                            {formatCurrency(saldo)}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles[sp.className] || ''}`}>
                              {sp.label || entrega.estado_pago}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles[so.className] || ''}`}>
                              {so.label || entrega.estado}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionsCell}>
                              <button className={styles.actionBtn} title="Ver detalle" onClick={() => verDetalle(entrega)}>
                                <FiEye />
                              </button>
                              <button className={styles.actionBtn} title={entrega.venta_id ? "Ver venta asociada" : "Ver pedido"} onClick={() => navigate(entrega.venta_id ? `/ventas/${entrega.venta_id}` : `/pedidos/${idDisplay}`)}>
                                <FiExternalLink />
                              </button>
                              {entrega.estado === 'TERMINADO' && (
                                <button
                                  className={`${styles.actionBtn} ${styles.actionDeliver}`}
                                  title="Marcar como entregado"
                                  onClick={() => { setDeliverTarget(entrega); setDeliverObservacion(''); }}
                                >
                                  <FiCheck />
                                </button>
                              )}
                              {entrega.estado === 'ENTREGADO' && (
                                <button
                                  className={`${styles.actionBtn} ${styles.actionReturn}`}
                                  title="Devolución del pedido"
                                  onClick={() => setDevolucionTarget(entrega)}
                                >
                                  <FiRotateCcw />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── Paginación (derecha, inteligente) ─── */}
            {maxPag > 1 && (
              <div className={styles.pagination}>
                <FiChevronLeft
                  className={`${styles.pageArrow} ${pagina <= 1 ? styles.pageArrowDisabled : ''}`}
                  onClick={() => pagina > 1 && setPagina((p) => p - 1)}
                />
                {pageNumbers.map((n, i) =>
                  n === '...' ? (
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                  ) : (
                    <span
                      key={n}
                      className={`${styles.pageNum} ${n === pagina ? styles.pageActive : ''}`}
                      onClick={() => setPagina(n)}
                    >
                      {n}
                    </span>
                  )
                )}
                <FiChevronRight
                  className={`${styles.pageArrow} ${pagina >= maxPag ? styles.pageArrowDisabled : ''}`}
                  onClick={() => pagina < maxPag && setPagina((p) => p + 1)}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* ─── Vista móvil: tarjetas ─── */}
      <div className={styles.mobileList}>
        {loading ? (
          <p className={styles.loadingText}>Cargando entregas…</p>
        ) : error ? (
          <p className={styles.loadingText}>{error}</p>
        ) : entregas.length === 0 ? (
          <p className={styles.loadingText}>No se encontraron entregas con los filtros seleccionados</p>
        ) : (
          entregas.map((entrega) => {
            const sp = statusPayment[entrega.estado_pago] || {};
            const so = statusOrder[entrega.estado] || {};
            const idDisplay = entrega.id || entrega.pedido_id;
            const clienteDisplay = entrega.cliente_nombres || entrega.cliente || '—';
            const fechaEstimada = entrega.fecha_entrega_estimada || '—';
            const fechaReal = entrega.fecha_entrega_real || '—';
            const total = entrega.precio_total ?? entrega.total ?? 0;
            const saldo = entrega.saldo ?? entrega.saldo_pendiente ?? 0;
            return (
              <Card key={idDisplay} className={styles.mobileCard}>
                <div className={styles.mobileHeader}>
                  <span className={styles.cellId}>#{idDisplay}</span>
                  <span className={`${styles.badge} ${styles[so.className] || ''}`}>
                    {so.label || entrega.estado}
                  </span>
                </div>
                <p className={styles.mobileClient}>{clienteDisplay}</p>
                <div className={styles.mobileInfoGrid}>
                  <div>
                    <span className={styles.mobileLabel}>Fecha estimada</span>
                    <span>{fechaEstimada}</span>
                  </div>
                  <div>
                    <span className={styles.mobileLabel}>Fecha de entrega</span>
                    <span>{fechaReal}</span>
                  </div>
                  <div>
                    <span className={styles.mobileLabel}>Total</span>
                    <span className={styles.cellCurrency}>{formatCurrency(total)}</span>
                  </div>
                  <div>
                    <span className={styles.mobileLabel}>Saldo</span>
                    <span className={`${styles.cellCurrency} ${saldo > 0 ? styles.cellDanger : ''}`}>
                      {formatCurrency(saldo)}
                    </span>
                  </div>
                </div>
                <div className={styles.mobileFooter}>
                  <span className={`${styles.badge} ${styles[sp.className] || ''}`}>
                    {sp.label || entrega.estado_pago}
                  </span>
                  <div className={styles.actionsCell}>
                    <button className={styles.actionBtn} title="Ver detalle" onClick={() => verDetalle(entrega)}>
                      <FiEye />
                    </button>
                    <button className={styles.actionBtn} title={entrega.venta_id ? "Ver venta asociada" : "Ver pedido"} onClick={() => navigate(entrega.venta_id ? `/ventas/reportes` : `/pedidos/${idDisplay}`)}>
                      <FiExternalLink />
                    </button>
                    {entrega.estado === 'TERMINADO' && (
                      <button
                        className={`${styles.actionBtn} ${styles.actionDeliver}`}
                        title="Marcar como entregado"
                        onClick={() => { setDeliverTarget(entrega); setDeliverObservacion(''); }}
                      >
                        <FiCheck />
                      </button>
                    )}
                    {entrega.estado === 'ENTREGADO' && (
                      <button
                        className={`${styles.actionBtn} ${styles.actionReturn}`}
                        title="Devolución del pedido"
                        onClick={() => setDevolucionTarget(entrega)}
                      >
                        <FiRotateCcw />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ─── Confirmación: marcar como entregado ─── */}
      {deliverTarget && (
        <Alert
          type="confirm"
          title="¿Marcar pedido como entregado?"
          message={`Estás a punto de cambiar el pedido #${deliverTarget.id} de "${deliverTarget.cliente_nombres || deliverTarget.cliente}" de "Terminado" a "Entregado".`}
          onCancel={() => { setDeliverTarget(null); setDeliverObservacion(''); }}
          onConfirm={handleDeliverConfirm}
        >
          <textarea
            className={styles.obsInput}
            placeholder="Observaciones (opcional)…"
            value={deliverObservacion}
            onChange={(e) => setDeliverObservacion(e.target.value)}
            rows={3}
          />
        </Alert>
      )}

      {/* ─── Loading durante la entrega ─── */}
      {deliverLoading && <LoadingOverlay title="Marcando como entregado…" message="Procesando la solicitud" />}

      {/* ─── Resultado de la operación ─── */}
      {deliverResult && (
        <Alert type={deliverResult.type} title={deliverResult.title} message={deliverResult.message} onClose={deliverResult.onClose} />
      )}

      {/* ─── Modal de devolución ─── */}
      {devolucionTarget && (
        <div className={styles.returnOverlay} onClick={() => setDevolucionTarget(null)}>
          <div className={styles.returnModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.returnClose} onClick={() => setDevolucionTarget(null)} title="Cerrar">
              <FiX />
            </button>

            <div className={styles.returnIconWrapper}>
              <FiRotateCcw />
            </div>

            <h3 className={styles.returnTitle}>¿Quieres hacer la devolución del pedido?</h3>
            <p className={styles.returnSubtitle}>
              El pedido <strong>#{devolucionTarget.id || devolucionTarget.pedido_id}</strong> de{' '}
              <strong>{devolucionTarget.cliente_nombres || devolucionTarget.cliente}</strong> será
              marcado como devuelto. Selecciona el motivo de la devolución:
            </p>

            <div className={styles.returnOptions}>
              <button
                className={styles.returnOption}
                onClick={() => {
                  setDevolucionConfirm({ tipo: 'ANULACION', entrega: devolucionTarget });
                  setDevolucionTarget(null);
                }}
              >
                <FiBox className={styles.returnOptionIcon} />
                <div className={styles.returnOptionContent}>
                  <span className={styles.returnOptionTitle}>Devolver producto al inventario</span>
                  <span className={styles.returnOptionDesc}>
                    El producto devuelto estará disponible nuevamente para la venta o para otros pedidos
                  </span>
                </div>
              </button>

              <button
                className={styles.returnOption}
                onClick={() => {
                  setDevolucionConfirm({ tipo: 'CORRECCION', entrega: devolucionTarget });
                  setDevolucionTarget(null);
                }}
              >
                <FiTool className={styles.returnOptionIcon} />
                <div className={styles.returnOptionContent}>
                  <span className={styles.returnOptionTitle}>Devolver para correcciones o modificaciones</span>
                  <span className={styles.returnOptionDesc}>
                    El pedido requiere ajustes, reparaciones o modificaciones antes de ser entregado nuevamente
                  </span>
                </div>
              </button>
            </div>

            <button className={styles.returnCancel} onClick={() => setDevolucionTarget(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal de confirmación de devolución (motivo) ─── */}
      {devolucionConfirm && (
        <div className={styles.returnOverlay} onClick={() => { setDevolucionConfirm(null); setDevolucionMotivo(''); setDevolucionMotivoError(''); }}>
          <div className={styles.returnModalConfirm} onClick={(e) => e.stopPropagation()}>
            <button className={styles.returnClose} onClick={() => { setDevolucionConfirm(null); setDevolucionMotivo(''); setDevolucionMotivoError(''); }} title="Cerrar">
              <FiX />
            </button>

            <div className={styles.returnIconWrapper}>
              <FiRotateCcw />
            </div>

            <h3 className={styles.returnTitle}>Confirmar devolución del pedido</h3>
            <p className={styles.returnSubtitle}>
              Pedido <strong>#{devolucionConfirm.entrega.id || devolucionConfirm.entrega.pedido_id}</strong> de{' '}
              <strong>{devolucionConfirm.entrega.cliente_nombres || devolucionConfirm.entrega.cliente}</strong>
              <br />
              Tipo de devolución:{' '}
              <strong>{devolucionConfirm.tipo === 'ANULACION' ? 'Devolver producto al inventario' : 'Devolver para correcciones o modificaciones'}</strong>
            </p>

            <div className={styles.returnConfirmField}>
              <label className={styles.returnConfirmLabel}>
                Motivo de la devolución <span className={styles.required}>*</span>
              </label>
              <textarea
                className={`${styles.returnConfirmTextarea} ${devolucionMotivoError ? styles.returnConfirmTextareaError : ''}`}
                placeholder="Describe el motivo de la devolución…"
                value={devolucionMotivo}
                onChange={(e) => {
                  setDevolucionMotivo(e.target.value);
                  if (devolucionMotivoError) setDevolucionMotivoError('');
                }}
                rows={4}
                maxLength={300}
              />
              {devolucionMotivoError && (
                <span className={styles.returnConfirmError}>{devolucionMotivoError}</span>
              )}
              <span className={styles.returnCharCounter}>
                {devolucionMotivo.length}/300
              </span>
            </div>

            <div className={styles.returnConfirmActions}>
              <button
                className={styles.returnConfirmCancel}
                onClick={() => { setDevolucionConfirm(null); setDevolucionMotivo(''); setDevolucionMotivoError(''); }}
              >
                Cancelar
              </button>
              <button
                className={styles.returnConfirmBtn}
                onClick={async () => {
                  const motivo = devolucionMotivo.trim();
                  if (!motivo) {
                    setDevolucionMotivoError('El motivo de la devolución es obligatorio');
                    return;
                  }
                  setDevolucionMotivoError('');
                  const { tipo, entrega } = devolucionConfirm;
                  const id = entrega.id || entrega.pedido_id;
                  setDevolucionConfirm(null);
                  setDevolucionMotivo('');
                  setDevolucionLoading(true);

                  try {
                    const resp = await devolverPedido(id, {
                      tipo_devolucion: tipo,
                      motivo,
                    });
                    setDevolucionLoading(false);

                    if (resp?.status) {
                      setDevolucionResult({
                        type: 'success',
                        title: 'Devolución registrada',
                        message: resp.msg || `El pedido #${id} ha sido devuelto correctamente.`,
                        onClose: () => window.location.reload(),
                      });
                    } else {
                      setDevolucionResult({
                        type: 'error',
                        title: 'Error',
                        message: resp?.msg || 'Error al registrar la devolución',
                        onClose: () => setDevolucionResult(null),
                      });
                    }
                  } catch (err) {
                    setDevolucionLoading(false);
                    setDevolucionResult({
                      type: 'error',
                      title: 'Error',
                      message: err?.response?.data?.error || 'No se pudo procesar la devolución',
                      onClose: () => setDevolucionResult(null),
                    });
                  }
                }}
              >
                Confirmar devolución
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Loading durante la devolución ─── */}
      {devolucionLoading && <LoadingOverlay title="Procesando devolución…" message="Registrando la devolución del pedido" />}

      {/* ─── Resultado de la devolución ─── */}
      {devolucionResult && (
        <Alert type={devolucionResult.type} title={devolucionResult.title} message={devolucionResult.message} onClose={devolucionResult.onClose} />
      )}

      {/* ─── Loading mientras se obtiene el detalle ─── */}
      {detalleLoading && <LoadingOverlay title="Cargando detalle…" message="Obteniendo información completa del pedido" />}

      {/* ─── Modal de detalle ─── */}
      {showModal && selectedEntrega && !detalleLoading && (
        <EntregasModal
          entrega={selectedEntrega}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Entregas;
