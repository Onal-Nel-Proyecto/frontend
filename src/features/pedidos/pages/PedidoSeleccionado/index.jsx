// ================================================================
// PedidoSeleccionado — Layout de detalle de un pedido
// Obtiene datos desde GET /pedidos/:id y los distribuye a los
// sub-componentes vía Outlet context.
// ================================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Outlet, NavLink } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiXCircle } from 'react-icons/fi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import { getPedidoById } from '../../services/pedidosService';
import PedidoForm from '../../components/PedidoForm';
import DetallePanel from '../../components/DetallePanel';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { cancelPedido } from '../../services/pedidosService';
import styles from './pedido_seleccionado.module.css';

const statusConfig = {
  PENDIENTE:  { label: 'Pendiente',  className: 'pending' },
  "EN PROCESO": { label: 'En proceso', className: 'inProcess' },
  TERMINADO:  { label: 'Terminado',  className: 'delivered' },
  ENTREGADO:  { label: 'Entregado',  className: 'delivered' },
  CANCELADO:  { label: 'Cancelado',  className: 'cancelled' },
};

const subPages = [
  { label: 'Detalle Pedido', to: '' },
  { label: 'Producción',     to: 'produccion' },
  { label: 'Cobro',          to: 'pagos' },
];

const PedidoSeleccionado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle(`Pedido #${id?.replace('#', '')}`);

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [detallePanel, setDetallePanel] = useState({ open: false, modo: 'view', detalle: null });
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  useEffect(() => {
    let cancel = false;
    const fetch = async () => {
      try {
        const resp = await getPedidoById(id);
        if (cancel) return;
        setPedido(resp);
      } catch {
        // error silencioso
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetch();
    return () => { cancel = true; };
  }, [id]);

  if (loading) {
    return <div className={styles.placeholder}>Cargando pedido…</div>;
  }

  if (!pedido) {
    return <div className={styles.placeholder}>Pedido no encontrado</div>;
  }

  const st = statusConfig[pedido.estado?.toUpperCase()] || {};
  const fecha = pedido.fecha_entrega || pedido.fecha_estimada_entrega;

  return (
    <div className={styles.page}>
      {/* ── Encabezado ── */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <button className={styles.backBtn} onClick={() => navigate('/pedidos')}>
            <FiArrowLeft />
            regresar a pedidos
          </button>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} title="Editar pedido" disabled={['ENTREGADO', 'CANCELADO'].includes(pedido.estado?.toUpperCase())} onClick={() => setShowPedidoForm(true)}>
              <FiEdit2 />
            </button>
            {!['ENTREGADO', 'TERMINADO', 'CANCELADO'].includes(pedido.estado?.toUpperCase()) && (
              <button
                className={`${styles.iconBtn} ${styles.iconDanger}`}
                title="Cancelar pedido"
                onClick={() => { setCancelMotivo(''); setShowCancelAlert(true); }}
              >
                <FiXCircle />
              </button>
            )}
          </div>
        </div>

        <div className={styles.headerRow}>
          <span className={styles.pedidoId}>Pedido #{pedido.pedido_id}</span>
          <span className={`${styles.badge} ${styles[st.className] || ''}`}>
            {st.label || pedido.estado}
          </span>
        </div>

        <p className={styles.descripcion}>{pedido.descripcion || 'Sin descripción'}</p>

        {pedido.observacion && (
          <p className={styles.observacion}>
            <span className={styles.obsLabel}>Observación:</span> {pedido.observacion}
          </p>
        )}

        <div className={styles.headerRow}>
          <span className={styles.cliente}>
            {pedido.cliente?.cliente_nombres || 'Cliente no especificado'}
          </span>
          <span className={styles.fecha}>
            {pedido.fecha_entrega ? 'Fecha de entrega:' : 'Fecha estimada:'}{' '}
            {fecha || '—'}
          </span>
        </div>
      </header>

      {/* ── Sub-páginas ── */}
      <nav className={styles.subNav}>
        <div className={styles.subNavInner}>
          {subPages.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === ''}
              className={({ isActive }) =>
                `${styles.subTab} ${isActive ? styles.subTabActive : ''}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Contenido con datos del pedido via React Context ── */}
      <main className={styles.content}>
        <Outlet context={{ pedido, openDetallePanel: setDetallePanel, isCanceled: pedido.estado?.toUpperCase() === 'CANCELADO' }} />
      </main>

      {/* Drawer editar pedido */}
      <PedidoForm
        isOpen={showPedidoForm}
        onClose={() => setShowPedidoForm(false)}
        pedido={pedido}
      />

      {/* Drawer detalle (ver / crear / editar) */}
      <DetallePanel
        isOpen={detallePanel.open}
        onClose={() => setDetallePanel({ open: false, modo: 'view', detalle: null })}
        modo={detallePanel.modo}
        detalle={detallePanel.detalle}
      />

      {/* Alerta cancelar pedido */}
      {showCancelAlert && (
        <Alert
          type="confirm"
          title="¿Cancelar pedido?"
          message="Esta acción no se puede deshacer. Ingresa el motivo de cancelación:"
          onCancel={() => setShowCancelAlert(false)}
          onConfirm={async () => {
            if (!cancelMotivo.trim()) return;
            setShowCancelAlert(false);
            setCancelLoading(true);
            try {
              const resp = await cancelPedido(pedido.pedido_id, { motivo: cancelMotivo });
              setCancelLoading(false);
              if (resp?.status) {
                setCancelResult({
                  type: 'success',
                  title: 'Pedido cancelado',
                  message: resp.msg || 'El pedido se canceló correctamente',
                  onClose: () => { setCancelResult(null); window.location.reload(); },
                });
              } else {
                setCancelResult({
                  type: 'error', title: 'Error', message: resp?.msg || 'Error al cancelar el pedido',
                  onClose: () => setCancelResult(null),
                });
              }
            } catch (err) {
              setCancelLoading(false);
              setCancelResult({
                type: 'error', title: 'Error',
                message: err?.response?.data?.error || 'No se pudo cancelar el pedido',
                onClose: () => setCancelResult(null),
              });
            }
          }}
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

      {/* Loading durante cancelación */}
      {cancelLoading && <LoadingOverlay title="Cancelando pedido…" message="Procesando la solicitud" />}

      {/* Resultado de cancelación */}
      {cancelResult && (
        <Alert type={cancelResult.type} title={cancelResult.title} message={cancelResult.message} onClose={cancelResult.onClose} />
      )}
    </div>
  );
};

export default PedidoSeleccionado;
