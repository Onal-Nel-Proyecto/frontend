// ================================================================
// Produccion — Sub-página de producción de un pedido
// Estados: pendiente → en proceso → terminado
// No se puede retroceder.
// ================================================================

import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FiPlay, FiXCircle, FiEdit2, FiClipboard, FiArrowRight } from 'react-icons/fi';
import Alert from '../../../../components/ui/feedback/Alert';
import { updateProduccion } from '../../services/pedidosService';
import ProduccionForm from '../ProduccionForm';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const estadoProdConfig = {
  PENDIENTE:  { label: 'Pendiente',  className: 'prodPending',  next: 'EN PROCESO' },
  'EN PROCESO': { label: 'En proceso', className: 'prodInProcess', next: 'TERMINADO' },
  // EN_PROCESO: { label: 'En proceso', className: 'prodInProcess', next: 'TERMINADO' },
  TERMINADO:  { label: 'Terminado',  className: 'prodTerminado', next: null },
  CANCELADO:  { label: 'Cancelado',  className: 'prodCancelled', next: null },
};

const getSiguienteEstado = (actual) => {
  const cfg = estadoProdConfig[actual?.toUpperCase()];
  return cfg?.next || null;
};

const labelSiguiente = (actual) => {
  const sig = getSiguienteEstado(actual);
  if (!sig) return null;
  return estadoProdConfig[sig]?.label || sig;
};

const Produccion = () => {
  const { pedido, isCanceled } = useOutletContext();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { produccion_id, detalle_id, estado_actual }
  const [loadingProd, setLoadingProd] = useState(false);
  const [errorProd, setErrorProd] = useState(null);

  const producciones = (pedido.detalles_pedido || []).flatMap(
    (d) =>
      (d.in_produccion || []).map((p) => ({
        ...p,
        detalle_id: d.detalle_id,
        producto_nombre: d.producto?.nombre || '—',
      }))
  );

  const detallesPendientes = (pedido.detalles_pedido || [])
    .map((d) => {
      const producido = (d.in_produccion || [])
        .filter((p) => p.estado?.toUpperCase() !== 'CANCELADO')
        .reduce((sum, p) => sum + (p.cantidad || 0), 0);
      return { ...d, pendiente: (d.cantidad || 0) - producido };
    })
    .filter((d) => d.pendiente > 0);

  const todosCompletos = detallesPendientes.length === 0;
  const totalEnProduccion = producciones.filter((p) => p.estado?.toUpperCase() !== 'TERMINADO' && p.estado?.toUpperCase() !== 'CANCELADO').length;
  const totalTerminadas = producciones.filter((p) => p.estado?.toUpperCase() === 'TERMINADO').length;

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    const { produccion_id, detalle_id, estado_actual } = confirmTarget;
    const sig = getSiguienteEstado(estado_actual);
    const nuevoEstado =
      estado_actual === 'CANCELAR'
        ? 'CANCELADO'
        : sig;

    if (!nuevoEstado) return;

    setConfirmTarget(null);
    setLoadingProd(true);

    try {
      await updateProduccion(pedido.pedido_id, detalle_id, produccion_id, { estado: nuevoEstado });

      // Solo redirigir a Entregas si el pedido completo quedó terminado
      // (todas las producciones en todos los detalles están TERMINADO/CANCELADO y no hay pendientes)
      if (nuevoEstado === 'TERMINADO') {
        const todasProducciones = (pedido.detalles_pedido || []).flatMap((d) =>
          (d.in_produccion || []).filter((p) => p.estado?.toUpperCase() !== 'CANCELADO')
        );
        const todasTerminadas = todasProducciones.every(
          (p) => p.produccion_id === produccion_id || p.estado?.toUpperCase() === 'TERMINADO'
        );
        const sinPendientes = (pedido.detalles_pedido || []).every((d) => {
          const producido = (d.in_produccion || [])
            .filter((p) => p.estado?.toUpperCase() !== 'CANCELADO')
            .reduce((sum, p) => sum + (p.cantidad || 0), 0);
          return (d.cantidad || 0) - producido <= 0;
        });

        if (todasTerminadas && sinPendientes) {
          navigate('/pedidos/entregas');
        } else {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } catch (err) {
      setErrorProd({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo actualizar la producción',
        onClose: () => setErrorProd(null),
      });
    } finally {
      setLoadingProd(false);
    }
  };

  if (producciones.length === 0 && !showForm) {
    return (
      <>
        <div className={styles.produccionEmpty}>
          <FiClipboard className={styles.produccionEmptyIcon} />
          <p className={styles.produccionEmptyTitle}>Este pedido aún no ha iniciado producción</p>
          <p className={styles.produccionEmptySub}>
            Una vez que agregues detalles al pedido, podrás iniciar la producción de cada uno desde esta sección.
          </p>
          <button className={styles.btnPlay} onClick={() => setShowForm(true)} disabled={todosCompletos || isCanceled}>
            <FiPlay />
            Iniciar primera producción
          </button>
        </div>
        <ProduccionForm isOpen={showForm} onClose={() => setShowForm(false)} detalles={pedido.detalles_pedido} />
      </>
    );
  }

  return (
    <>
      <div className={styles.produccionContent}>
        {/* Resumen produccion */}
        <section className={styles.cardSection}>
          <h3 className={styles.sectionTitle}>Resumen de producción</h3>
          <div className={styles.produccionResumen}>
            <div className={styles.resumenItem}>
              <span className={styles.resumenLabel}>Total en producción</span>
              <span className={styles.resumenValue}>{totalEnProduccion}</span>
            </div>
            <div className={styles.resumenItem}>
              <span className={styles.resumenLabel}>Producción terminada</span>
              <span className={`${styles.resumenValue} ${styles.resumenVerde}`}>{totalTerminadas}</span>
            </div>
          </div>
        </section>
        {/* Orden de produccion */}
        <section className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Órdenes de producción</h3>
            <button className={styles.btnPlay} onClick={() => setShowForm(true)} disabled={todosCompletos || isCanceled}>
              <FiPlay />
              {todosCompletos ? 'Completado' : 'Iniciar nueva producción'}
            </button>
          </div>

          <div className={styles.produccionGrid}>
            {producciones.map((prod, i) => {
              const est = prod.estado?.toUpperCase();
              const cfg = estadoProdConfig[est] || {};
              const esTerminado = est === 'TERMINADO';
              const esCancelado = est === 'CANCELADO';
              const inactivo = esTerminado || esCancelado || isCanceled;
              const sigLabel = labelSiguiente(est);

              return (
                <div key={prod.produccion_id || i} className={styles.prodCard}>
                  <div className={styles.prodCardHeader}>
                    <div>
                      <span className={styles.prodCardId}>#{prod.produccion_id}</span>
                      <span className={styles.prodCardDetalle}>Detalle: {prod.detalle_id}</span>
                    </div>
                    <span className={`${styles.prodEstBadge} ${styles[cfg.className] || ''}`}>
                      {cfg.label || prod.estado}
                    </span>
                  </div>

                  <p className={styles.prodCardProducto}>{prod.producto_nombre}</p>

                  <div className={styles.prodCardMeta}>
                    <div className={styles.prodCardMetaItem}>
                      <span className={styles.prodMetaLabel}>Cantidad</span>
                      <span className={styles.prodMetaValue}>{prod.cantidad} uds</span>
                    </div>
                    <div className={styles.prodCardMetaItem}>
                      <span className={styles.prodMetaLabel}>Inicio</span>
                      <span className={styles.prodMetaValue}>{prod.fecha_inicio || '—'}</span>
                    </div>
                    <div className={styles.prodCardMetaItem}>
                      <span className={styles.prodMetaLabel}>Finalización</span>
                      <span className={styles.prodMetaValue}>{prod.fecha_fin || '—'}</span>
                    </div>
                  </div>

                  <div className={styles.prodCardActions}>
                    {sigLabel && !inactivo && (
                      <button
                        className={styles.prodActionBtn}
                        title={`Avanzar a ${sigLabel}`}
                        onClick={() => setConfirmTarget({ produccion_id: prod.produccion_id, detalle_id: prod.detalle_id, estado_actual: est })}
                      >
                        <FiArrowRight />
                        {sigLabel}
                      </button>
                    )}
                    {!inactivo && (
                      <button
                        className={`${styles.prodActionBtn} ${styles.prodActionDanger}`}
                        title="Cancelar producción"
                        disabled={inactivo}
                        onClick={() =>
                          setConfirmTarget({ produccion_id: prod.produccion_id, detalle_id: prod.detalle_id, estado_actual: 'CANCELAR' })
                        }
                      >
                        <FiXCircle />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      <ProduccionForm isOpen={showForm} onClose={() => setShowForm(false)} detalles={pedido.detalles_pedido} />

      {/* Error de producción */}
      {errorProd && <Alert type={errorProd.type} title={errorProd.title} message={errorProd.message} onClose={errorProd.onClose} />}

      {/* Confirmación avanzar / cancelar producción */}
      {confirmTarget && (
        <Alert
          type="confirm"
          title={
            confirmTarget.estado_actual === 'CANCELAR'
              ? '¿Cancelar producción?'
              : `¿Avanzar a ${labelSiguiente(confirmTarget.estado_actual)}?`
          }
          message={
            confirmTarget.estado_actual === 'CANCELAR'
              ? 'Esta acción no se puede deshacer.'
              : `La producción pasará de ${estadoProdConfig[confirmTarget.estado_actual]?.label || confirmTarget.estado_actual} a ${labelSiguiente(confirmTarget.estado_actual)}.`
          }
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </>
  );
};

export default Produccion;
