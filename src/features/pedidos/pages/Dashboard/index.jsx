// ================================================================
// DashboardPedidos — Dashboard principal del módulo de pedidos
// Muestra indicadores, calendario de entregas, producción activa
// y últimos pedidos registrados.
// Consume datos desde GET /dashboard/pedidos
// ================================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock,
  FiCalendar,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import { GiSewingMachine } from 'react-icons/gi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import Card from '../../../../components/common/Card';
import { getDashboardPedidos } from '../../../../api/endpoints/dashboardEndpoints';
import styles from './dashboardPed.module.css';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const STATUS_MAP = {
  PENDIENTE:  { label: 'Pendiente',  className: 'pending' },
  EN_PROCESO: { label: 'En proceso', className: 'inProcess' },
  ENTREGADO:  { label: 'Entregado',  className: 'delivered' },
  CANCELADO:  { label: 'Cancelado',  className: 'cancelled' },
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const today = new Date();

const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
};

const formatDate = (str) => {
  if (!str) return '—';
  // Si ya viene en DD/MM/YYYY devolver igual
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  // Si viene en YYYY-MM-DD convertir
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return str;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};

const parseDate = (str) => {
  if (!str) return new Date(0);
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  // YYYY-MM-DD
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const diffDays = (a, b) => {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isOverdue = (pedido) => {
  if (pedido.estado === 'ENTREGADO') return false;
  const entrega = parseDate(pedido.fecha_entrega || pedido.start);
  return diffDays(today, entrega) < 0;
};

const isNearDue = (pedido) => {
  if (pedido.estado === 'ENTREGADO') return false;
  const entrega = parseDate(pedido.fecha_entrega || pedido.start);
  const days = diffDays(today, entrega);
  return days >= 0 && days <= 3;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Calendario de mes
// ═══════════════════════════════════════════════════════════════

const CalendarGrid = ({ currentDate, pedidos, onSelectPedido }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const pedidosDelMes = (pedidos || []).filter((p) => {
    const d = parseDate(p.fecha_entrega || p.start);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getPedidosForDay = (day) =>
    pedidosDelMes.filter((p) => {
      const d = parseDate(p.fecha_entrega || p.start);
      return d.getDate() === day;
    });

  return (
    <div className={styles.calendarGrid}>
      {DAYS_OF_WEEK.map((name) => (
        <div key={name} className={styles.calWeekday}>{name}</div>
      ))}

      {cells.map((day, i) => {
        if (day === null) return <div key={`empty-${i}`} className={styles.calDayEmpty} />;

        const dayPedidos = getPedidosForDay(day);
        const isToday = isSameDay(new Date(year, month, day), today);

        return (
          <div
            key={day}
            className={`${styles.calDay} ${isToday ? styles.calDayToday : ''}`}
          >
            <span className={styles.calDayNum}>{day}</span>
            <div className={styles.calEvents}>
              {dayPedidos.slice(0, 3).map((p) => {
                const st = STATUS_MAP[p.estado] || {};
                const overdue = isOverdue(p);
                const near = isNearDue(p);
                return (
                  <button
                    key={p.id}
                    className={`${styles.calEvent} ${styles[st.className] || ''} ${overdue ? styles.eventOverdue : ''} ${near && !overdue ? styles.eventNear : ''}`}
                    onClick={() => onSelectPedido(p)}
                    title={`#${p.id} - ${p.cliente} (${st.label})`}
                  >
                    {p.title || p.id}
                    {overdue && <span className={styles.eventTagRetrasado}>Retrasado</span>}
                    {near && !overdue && <span className={styles.eventTagProximo}>Próximo</span>}
                  </button>
                );
              })}
              {dayPedidos.length > 3 && (
                <span className={styles.calMore}>+{dayPedidos.length - 3} más</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Modal de detalle de pedido
// ═══════════════════════════════════════════════════════════════

const PedidoModal = ({ pedido, onClose }) => {
  if (!pedido) return null;
  const st = STATUS_MAP[pedido.estado] || {};
  const esEntregado = pedido.estado === 'ENTREGADO';
  const fechaLabel = esEntregado ? 'Fecha de entrega' : 'Fecha estimada de entrega';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>#{pedido.id}</h3>
          <span className={`${styles.badge} ${styles[st.className] || ''}`}>
            {st.label || pedido.estado}
          </span>
          <button className={styles.modalClose} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Cliente</span>
            <span className={styles.modalValue}>{pedido.cliente}</span>
          </div>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Descripción</span>
            <span className={styles.modalValue}>{pedido.descripcion || '—'}</span>
          </div>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Observación</span>
            <span className={styles.modalValue}>{pedido.observacion || 'Sin observación'}</span>
          </div>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Fecha de registro</span>
            <span className={styles.modalValue}>{formatDate(pedido.fecha_registro)}</span>
          </div>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>{fechaLabel}</span>
            <span className={styles.modalValue}>{formatDate(pedido.fecha_entrega || pedido.start)}</span>
          </div>
          <div className={styles.modalRow}>
            <span className={styles.modalLabel}>Valor total</span>
            <span className={styles.modalValue}>{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const DashboardPedidos = () => {
  useDocumentTitle('Dashboard de Pedidos');
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch data from API ───
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDashboardPedidos();
        if (cancelled) return;
        if (response?.status && response?.data) {
          setData(response.data);
        } else {
          setError('Respuesta inválida del servidor');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.error || err?.message || 'Error al cargar los datos del dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ─── Stats desde API ───
  const stats = useMemo(() => {
    if (!data?.summary) return { pendientes: 0, enProceso: 0, entregasSemana: 0, retrasados: 0 };
    return {
      pendientes: data.summary.pendientes ?? 0,
      enProceso: data.summary.enProceso ?? 0,
      entregasSemana: data.summary.entregasSemana ?? 0,
      retrasados: data.summary.retrasados ?? 0,
    };
  }, [data]);

  // ─── Eventos del calendario ───
  const calendarEvents = useMemo(() => data?.calendarEvents || [], [data]);

  // ─── Producción activa ───
  const produccionActiva = useMemo(() => data?.produccionActiva || [], [data]);

  // ─── Últimos pedidos ───
  const ultimosPedidos = useMemo(() => data?.ultimosPedidos || [], [data]);

  const handlePrevMonth = useCallback(
    () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    []
  );

  const handleNextMonth = useCallback(
    () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
    []
  );

  const handleSelectPedido = useCallback((pedido) => {
    setSelectedPedido(pedido);
  }, []);

  const currentMonthLabel = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // ─── Loading state ───
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <FiRefreshCw className={styles.loadingIcon} />
          <p className={styles.loadingMessage}>Cargando dashboard…</p>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <FiAlertTriangle className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>Error al cargar</h3>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            <FiRefreshCw /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Dashboard de Pedidos</h2>
          <p className={styles.subtitle}>
            Monitorea el estado de producción y las fechas de entrega de los pedidos.
          </p>
        </div>
      </header>

      {/* ─── Indicadores ─── */}
      <section className={styles.cardsGrid}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
            <FiClock />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.pendientes}</span>
            <span className={styles.statLabel}>Pedidos Pendientes</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <GiSewingMachine />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.enProceso}</span>
            <span className={styles.statLabel}>Pedidos en Proceso</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <FiCalendar />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.entregasSemana}</span>
            <span className={styles.statLabel}>Entregas Esta Semana</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <FiAlertTriangle />
          </div>
          <div className={styles.statBody}>
            <span className={`${styles.statValue} ${stats.retrasados > 0 ? styles.statValueDanger : ''}`}>
              {stats.retrasados}
            </span>
            <span className={styles.statLabel}>Pedidos Retrasados</span>
            {stats.retrasados > 0 && (
              <span className={styles.statAlert}>Requiere atención</span>
            )}
          </div>
        </Card>
      </section>

      {/* ─── Contenido principal: Calendario + Producción Activa ─── */}
      <div className={styles.mainContent}>
        <Card className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <h3 className={styles.sectionTitle}>Calendario de Entregas</h3>
            <div className={styles.calendarNav}>
              <button className={styles.calNavBtn} onClick={handlePrevMonth}>
                <FiChevronLeft />
              </button>
              <span className={styles.calMonthLabel}>{currentMonthLabel}</span>
              <button className={styles.calNavBtn} onClick={handleNextMonth}>
                <FiChevronRight />
              </button>
            </div>
          </div>

          <div className={styles.calLegend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotPending}`} /> Pendiente
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotProcess}`} /> En Proceso
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotDelivered}`} /> Entregado
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotNear}`} /> Próximo (1-3 días)
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotOverdue}`} /> Retrasado
            </span>
          </div>

          <CalendarGrid
            currentDate={currentDate}
            pedidos={calendarEvents}
            onSelectPedido={handleSelectPedido}
          />
        </Card>

        <Card className={styles.prodCard}>
          <h3 className={styles.sectionTitle}>Producción Activa</h3>
          <p className={styles.prodSubtitle}>Pedidos actualmente en proceso</p>

          <div className={styles.prodList}>
            {produccionActiva.length > 0 ? (
              produccionActiva.map((pedido) => {
                const st = STATUS_MAP[pedido.estado] || {};
                const overdue = isOverdue(pedido);
                const near = isNearDue(pedido);
                return (
                  <div key={pedido.id} className={styles.prodItem}>
                    <div className={styles.prodHeader}>
                      <span className={styles.prodId}>#{pedido.id}</span>
                      <span className={`${styles.badgeSmall} ${styles[st.className] || ''}`}>
                        {st.label}
                      </span>
                    </div>
                    <span className={styles.prodClient}>{pedido.cliente}</span>
                    <span className={styles.prodInfo}>
                      {pedido.producto || pedido.descripcion} — Categoría: {pedido.categoria || 'Sin categoría'} — Cantidad: {pedido.cantidad}
                    </span>
                    {overdue && <span className={styles.prodOverdue}>Retrasado</span>}
                    {near && !overdue && <span className={styles.prodNear}>Próximo a vencer</span>}
                  </div>
                );
              })
            ) : (
              <div className={styles.prodEmpty}>
                <p className={styles.emptyText}>No hay ningún pedido en producción</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Tabla: Últimos Pedidos ─── */}
      <Card className={styles.tableCard}>
        <h3 className={styles.sectionTitle}>Últimos Pedidos Registrados</h3>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Cliente</th>
                <th>Fecha Registro</th>
                <th>Fecha Entrega</th>
                <th>Estado</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ultimosPedidos.length > 0 ? (
                ultimosPedidos.map((p) => {
                  const st = STATUS_MAP[p.estado] || {};
                  return (
                    <tr key={p.id} className={styles.tableRow}>
                      <td className={styles.cellId}>#{p.id}</td>
                      <td className={styles.cellClient}>{p.cliente}</td>
                      <td>{formatDate(p.fecha_registro)}</td>
                      <td>{formatDate(p.fecha_entrega)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className={styles.cellCurrency}>{formatCurrency(p.total)}</td>
                      <td>
                        <button
                          className={styles.actionBtn}
                          onClick={() => navigate(`/pedidos/${p.id}`)}
                          title="Ver detalle"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>No hay pedidos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista móvil */}
        <div className={styles.mobileList}>
          {ultimosPedidos.length > 0 ? (
            ultimosPedidos.map((p) => {
              const st = STATUS_MAP[p.estado] || {};
              return (
                <div
                  key={p.id}
                  className={styles.mobileCard}
                  onClick={() => navigate(`/pedidos/${p.id}`)}
                >
                  <div className={styles.mobileHeader}>
                    <span className={styles.cellId}>#{p.id}</span>
                    <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                      {st.label}
                    </span>
                  </div>
                  <span className={styles.mobileClient}>{p.cliente}</span>
                  <div className={styles.mobileInfo}>
                    <span>Registro: {formatDate(p.fecha_registro)}</span>
                    <span>Entrega: {formatDate(p.fecha_entrega)}</span>
                  </div>
                  <span className={styles.cellCurrency}>{formatCurrency(p.total)}</span>
                </div>
              );
            })
          ) : (
            <p className={styles.emptyText}>No hay pedidos registrados</p>
          )}
        </div>
      </Card>

      {/* ─── Modal de detalle ─── */}
      {selectedPedido && (
        <PedidoModal
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
        />
      )}
    </div>
  );
};

export default DashboardPedidos;
