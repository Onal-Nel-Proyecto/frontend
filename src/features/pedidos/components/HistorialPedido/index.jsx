// ================================================================
// HistorialPedido — Subpágina de historial de cambios del pedido
// Muestra eventos en orden cronológico descendente.
// Solo visible para usuarios con rol Administrador.
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import { getHistorialPedido } from '../../services/pedidosService';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import styles from './historial.module.css';

// ── Mapa de colores para estados ──
const ESTADO_DOT = {
  PENDIENTE:  styles.dotPending,
  'EN PROCESO': styles.dotInProcess,
  TERMINADO:  styles.dotTerminado,
  ENTREGADO:  styles.dotEntregado,
  CANCELADO:  styles.dotCancelado,
};

const ESTADO_LABEL = {
  PENDIENTE:  'Pendiente',
  'EN PROCESO': 'En proceso',
  TERMINADO:  'Terminado',
  ENTREGADO:  'Entregado',
  CANCELADO:  'Cancelado',
};

// ── Formatear fecha y hora ──
const formatDateTime = (str) => {
  if (!str) return '—';
  // Soporta formatos: "2026-06-13 14:24:26" o ISO
  const cleaned = str.replace('T', ' ');
  const [datePart, timePart] = cleaned.split(' ');
  if (!datePart) return str;
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return str;
  const fecha = `${day}/${month}/${year}`;
  if (timePart) {
    // Mostrar solo HH:mm (sin segundos)
    const [hh, mm] = timePart.split(':');
    return `${fecha} ${hh}:${mm}`;
  }
  return fecha;
};

// ── Componente principal ──
const HistorialPedido = () => {
  const { pedido } = useOutletContext();

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ maxPag: 1, pagAct: 1 });

  const loadHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getHistorialPedido(pedido.pedido_id);
      setHistorial(result.data || []);
      setPagination({
        maxPag: result.maxPag || 1,
        pagAct: result.pagAct || 1,
      });
    } catch {
      // Silencio — el componente simplemente se muestra vacío
    } finally {
      setLoading(false);
    }
  }, [pedido.pedido_id]);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  // ── Render ──
  return (
    <div className={styles.historialContent}>
      <section className={styles.cardSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <FiClock />
            Historial de Pedidos
            {historial.length > 0 && (
              <span className={styles.countBadge}>
                {historial.length} registro{historial.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <button
            className={styles.btnRefresh}
            onClick={loadHistorial}
            disabled={loading}
            title="Actualizar historial"
          >
            <FiRefreshCw className={loading ? styles.spin : ''} />
          </button>
        </div>

        {loading ? (
          <LoadingOverlay title="Cargando historial…" message="Obteniendo eventos del pedido" />
        ) : historial.length > 0 ? (
          <div className={styles.timeline}>
            {historial.map((evento) => {
              const dotClass = ESTADO_DOT[evento.estado_actual] || styles.dotDefault;
              const estadoAntLabel = ESTADO_LABEL[evento.estado_anterior] || evento.estado_anterior;
              const estadoActLabel = ESTADO_LABEL[evento.estado_actual] || evento.estado_actual;
              const usuarioNombre = [evento.usuario?.user_nombres, evento.usuario?.user_apellidos]
                .filter(Boolean)
                .join(' ')
                .trim() || '—';

              return (
                <div key={evento.hist_id} className={styles.timelineItem}>
                  <div className={styles.timelineDot}>
                    <span className={`${styles.dot} ${dotClass}`} />
                    <div className={styles.timelineLine} />
                  </div>
                  <div className={styles.timelineCard}>
                    <div className={styles.timelineMeta}>
                      <span className={styles.timelineDate}>
                        {formatDateTime(evento.fecha_registro)}
                      </span>
                      <span className={styles.timelineUser}>
                        {usuarioNombre}
                      </span>
                    </div>
                    <div className={styles.timelineAction}>
                      <span className={`${styles.stateBadge} ${styles.statePrev}`}>
                        {estadoAntLabel}
                      </span>
                      <span className={styles.arrow}>→</span>
                      <span className={`${styles.stateBadge} ${styles.stateNext}`}>
                        {estadoActLabel}
                      </span>
                    </div>
                    {evento.observacion && (
                      <p className={styles.timelineObs}>{evento.observacion}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.historyEmpty}>
            <div className={styles.historyEmptyIcon}>
              <FiClock />
            </div>
            <p className={styles.historyEmptyText}>No hay eventos registrados</p>
            <p className={styles.historyEmptySub}>
              Aún no se han realizado cambios de estado sobre este pedido.
            </p>
          </div>
        )}

        {/* Paginación (reservado para futuro) */}
        {pagination.maxPag > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pagInfo}>
              Página {pagination.pagAct} de {pagination.maxPag}
            </span>
          </div>
        )}
      </section>
    </div>
  );
};

export default HistorialPedido;
