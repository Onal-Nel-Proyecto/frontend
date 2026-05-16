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
import styles from './pedido_seleccionado.module.css';

const statusConfig = {
  PENDIENTE:  { label: 'Pendiente',  className: 'pending' },
  EN_PROCESO: { label: 'En proceso', className: 'inProcess' },
  TERMINADO:  { label: 'Terminado',  className: 'delivered' },
  ENTREGADO:  { label: 'Entregado',  className: 'delivered' },
  CANCELADO:  { label: 'Cancelado',  className: 'cancelled' },
};

const subPages = [
  { label: 'Detalle Pedido', to: '' },
  { label: 'Producción',     to: 'produccion' },
  { label: 'Pagos',          to: 'pagos' },
];

const PedidoSeleccionado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle(`Pedido #${id?.replace('#', '')}`);

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

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
            <button className={styles.iconBtn} title="Editar pedido">
              <FiEdit2 />
            </button>
            {pedido.estado?.toUpperCase() !== 'ENTREGADO' && (
              <button className={`${styles.iconBtn} ${styles.iconDanger}`} title="Cancelar pedido">
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
        <Outlet context={{ pedido }} />
      </main>
    </div>
  );
};

export default PedidoSeleccionado;
