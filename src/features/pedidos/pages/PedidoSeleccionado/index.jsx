// ================================================================
// PedidoSeleccionado — Layout de detalle de un pedido
// Obtiene datos desde GET /pedidos/:id y los distribuye a los
// sub-componentes vía Outlet context.
// ================================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom';
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

// ── Datos de ejemplo (fallback cuando la API no responde) ──
const PEDIDOS_DETALLE_EJEMPLO = {
  'PED-001': {
    pedido_id: 'PED-001',
    estado: 'TERMINADO',
    descripcion: 'Vestido de Noche Seda — Talla M',
    observacion: 'Cliente pidió ajuste en la cintura. Entregar antes del 15 de febrero.',
    cliente: { cliente_nombres: 'María García López' },
    fecha_entrega: '2025-02-15',
    fecha_estimada_entrega: '2025-02-15',
    detalles_pedido: [
      { detalle_id: 1, producto: { nombre: 'Vestido de Noche Seda' }, cantidad: 1, in_produccion: [{ id: 1, estado: 'TERMINADO' }] },
    ],
  },
  'PED-002': {
    pedido_id: 'PED-002',
    estado: 'EN_PROCESO',
    descripcion: 'Blazer Lino Clásico — Talla L',
    observacion: '',
    cliente: { cliente_nombres: 'Alejandro Martínez Ruiz' },
    fecha_entrega: null,
    fecha_estimada_entrega: '2025-02-20',
    detalles_pedido: [
      { detalle_id: 2, producto: { nombre: 'Blazer Lino Clásico' }, cantidad: 1, in_produccion: [{ id: 2, estado: 'EN_PROCESO' }] },
    ],
  },
  'PED-003': {
    pedido_id: 'PED-003',
    estado: 'PENDIENTE',
    descripcion: 'Vestido de Día Lino + Pañuelo Seda',
    observacion: 'Pañuelo en seda tussar color marfil.',
    cliente: { cliente_nombres: 'Carmen Herrera Díaz' },
    fecha_entrega: null,
    fecha_estimada_entrega: '2025-03-01',
    detalles_pedido: [
      { detalle_id: 3, producto: { nombre: 'Vestido de Día Lino' }, cantidad: 1, in_produccion: [] },
      { detalle_id: 4, producto: { nombre: 'Pañuelo Seda Tussar' }, cantidad: 1, in_produccion: [] },
    ],
  },
  'PED-004': {
    pedido_id: 'PED-004',
    estado: 'PENDIENTE',
    descripcion: 'Corbata Terciopelo Italia x2',
    observacion: '',
    cliente: { cliente_nombres: 'Roberto Sánchez Vega' },
    fecha_entrega: null,
    fecha_estimada_entrega: '2025-03-10',
    detalles_pedido: [
      { detalle_id: 5, producto: { nombre: 'Corbata Terciopelo Italia' }, cantidad: 2, in_produccion: [] },
    ],
  },
  'PED-005': {
    pedido_id: 'PED-005',
    estado: 'ENTREGADO',
    descripcion: 'Pañuelo Seda Tussar + Vestido Noche',
    observacion: 'Entregado exitosamente. Cliente satisfecho.',
    cliente: { cliente_nombres: 'Laura Jiménez Torres' },
    fecha_entrega: '2025-02-28',
    fecha_estimada_entrega: '2025-02-28',
    detalles_pedido: [
      { detalle_id: 6, producto: { nombre: 'Pañuelo Seda Tussar' }, cantidad: 1, in_produccion: [{ id: 3, estado: 'TERMINADO' }] },
      { detalle_id: 7, producto: { nombre: 'Vestido Noche' }, cantidad: 1, in_produccion: [{ id: 4, estado: 'TERMINADO' }] },
    ],
  },
};

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
  const [cancelMotivoError, setCancelMotivoError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  useEffect(() => {
    let cancel = false;
    const fetch = async () => {
      try {
        const resp = await getPedidoById(id);
        if (cancel) return;

        // Validar que el pedido sea de tipo CLIENTE
        const origen = resp?.tipo_origen || resp?.tipo_de_origen || '';
        if (origen && origen !== 'CLIENTE') {
          console.warn(`[PedidoSeleccionado] Pedido #${id} no es de tipo CLIENTE (${origen}), redirigiendo`);
          navigate('/pedidos/dash', { replace: true });
          return;
        }

        setPedido(resp);
      } catch {
        console.warn('[PedidoSeleccionado] API no disponible, cargando datos de ejemplo');
        if (!cancel) {
          const ejemplo = PEDIDOS_DETALLE_EJEMPLO[id];
          if (ejemplo) {
            // Los ejemplos no tienen tipo_origen, se muestran normalmente
            setPedido(ejemplo);
          } else {
            setPedido(null);
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetch();
    return () => { cancel = true; };
  }, [id, navigate]);

  // ── Redirigir desde /pagos si precio_total es inválido ──
  useEffect(() => {
    if (!pedido) return;
    const precioTotal = Number(pedido.precio_total ?? pedido.total_general ?? 0);
    if (precioTotal <= 0 && location.pathname.endsWith('/pagos')) {
      navigate(`/pedidos/${id}`, { replace: true });
    }
  }, [pedido, location.pathname, navigate, id]);

  if (loading) {
    return <div className={styles.placeholder}>Cargando pedido…</div>;
  }

  if (!pedido) {
    return <div className={styles.placeholder}>Pedido no encontrado</div>;
  }

  const st = statusConfig[pedido.estado?.toUpperCase()] || {};
  const precioTotal = Number(pedido.precio_total ?? pedido.total_general ?? 0);
  const precioValido = precioTotal > 0;
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
          <span className={styles.totalPrice}>
            <strong>Total:</strong> ${precioTotal.toLocaleString()}
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
          {subPages.map((tab) => {
            const isPagosTab = tab.to === 'pagos';
            if (isPagosTab && !precioValido) {
              return (
                <span key={tab.to} className={`${styles.subTab} ${styles.subTabDisabled}`}>
                  {tab.label}
                </span>
              );
            }
            return (
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
            );
          })}
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
        pedidoEstado={pedido.estado}
      />

      {/* Alerta cancelar pedido */}
      {showCancelAlert && (
        <Alert
          type="confirm"
          title="¿Cancelar pedido?"
          message="Esta acción no se puede deshacer. Ingresa el motivo de cancelación:"
          onCancel={() => setShowCancelAlert(false)}
          onConfirm={async () => {
            if (!cancelMotivo.trim()) {
              setCancelMotivoError('El motivo de cancelación es obligatorio');
              return;
            }
            setCancelMotivoError('');
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
            className={`${styles.cancelInput} ${cancelMotivoError ? styles.cancelInputError : ''}`}
            placeholder="Motivo de cancelación…"
            value={cancelMotivo}
            onChange={(e) => {
              setCancelMotivo(e.target.value);
              if (cancelMotivoError) setCancelMotivoError('');
            }}
            rows={3}
            cols={3}
            maxLength={150}
            required
          />
          {cancelMotivoError && (
            <span className={styles.cancelError}>{cancelMotivoError}</span>
          )}
          <span className={styles.charCounter}>
            {cancelMotivo.length}/150
          </span>
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
