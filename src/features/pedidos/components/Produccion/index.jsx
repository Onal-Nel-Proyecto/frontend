// ================================================================
// Produccion — Sub-página de producción de un pedido
// Muestra las órdenes de producción obtenidas desde el backend.
// ================================================================

import { useOutletContext } from 'react-router-dom';
import { FiPlay, FiXCircle, FiEdit2, FiClipboard } from 'react-icons/fi';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const estadoProdConfig = {
  PENDIENTE:  { label: 'Pendiente',  className: 'prodPending' },
  'EN PROCESO': { label: 'En proceso', className: 'prodInProcess' },
  EN_PROCESO: { label: 'En proceso', className: 'prodInProcess' },
  TERMINADO:  { label: 'Terminado',  className: 'prodTerminado' },
};

const Produccion = () => {
  const { pedido } = useOutletContext();

  // Extraer todas las producciones de todos los detalles
  const producciones = (pedido.detalles_pedido || []).flatMap(
    (d) =>
      (d.in_produccion || []).map((p) => ({
        ...p,
        detalle_id: d.detalle_id,
        producto_nombre: d.producto?.nombre || '—',
      }))
  );

  const totalEnProduccion = producciones.filter((p) => p.estado?.toUpperCase() !== 'TERMINADO').length;
  const totalTerminadas = producciones.filter((p) => p.estado?.toUpperCase() === 'TERMINADO').length;

  const puedeCancelar = (estado) => estado?.toUpperCase() !== 'TERMINADO';

  if (producciones.length === 0) {
    return (
      <div className={styles.produccionEmpty}>
        <FiClipboard className={styles.produccionEmptyIcon} />
        <p className={styles.produccionEmptyTitle}>Este pedido aún no ha iniciado producción</p>
        <p className={styles.produccionEmptySub}>
          Una vez que agregues detalles al pedido, podrás iniciar la producción de cada uno desde esta sección.
        </p>
        <button className={styles.btnPlay}>
          <FiPlay />
          Iniciar primera producción
        </button>
      </div>
    );
  }

  return (
    <div className={styles.produccionContent}>
      {/* Cards de producción */}
      <section className={styles.cardSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Órdenes de producción</h3>
          <button className={styles.btnPlay}>
            <FiPlay />
            Iniciar nueva producción
          </button>
        </div>

        <div className={styles.produccionGrid}>
          {producciones.map((prod, i) => {
            const st = estadoProdConfig[prod.estado?.toUpperCase()] || {};
            return (
              <div key={prod.produccion_id || i} className={styles.prodCard}>
                <div className={styles.prodCardHeader}>
                  <div>
                    <span className={styles.prodCardId}>#{prod.produccion_id}</span>
                    <span className={styles.prodCardDetalle}>Detalle: {prod.detalle_id}</span>
                  </div>
                  <span className={`${styles.prodEstBadge} ${styles[st.className] || ''}`}>
                    {st.label || prod.estado}
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
                  <button className={styles.prodActionBtn} title="Cambiar estado">
                    <FiEdit2 />
                    Cambiar estado
                  </button>
                  <button
                    className={`${styles.prodActionBtn} ${styles.prodActionDanger}`}
                    title="Cancelar producción"
                    disabled={!puedeCancelar(prod.estado)}
                  >
                    <FiXCircle />
                    Cancelar producción
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resumen */}
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
    </div>
  );
};

export default Produccion;
