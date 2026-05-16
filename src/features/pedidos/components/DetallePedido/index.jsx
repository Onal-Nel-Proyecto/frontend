// ================================================================
// DetallePedido — Sub-página de detalle del pedido (index)
// Muestra referencias (imágenes) y tabla con los detalles reales
// del pedido obtenidos desde el backend.
// ================================================================

import { useOutletContext } from 'react-router-dom';
import { FiPlus, FiUpload, FiEye, FiTrash2, FiImage } from 'react-icons/fi';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const DetallePedido = () => {
  const { pedido } = useOutletContext();
  const detalles = pedido.detalles_pedido || [];

  return (
    <div className={styles.detalleContent}>
      {/* ── Referencias ── */}
      <section className={styles.cardSection}>
        <h3 className={styles.sectionTitle}>Referencias</h3>
        <div className={styles.referencesEmpty}>
          <div className={styles.referencesIcon}><FiImage /></div>
          <p className={styles.referencesText}>No hay imágenes de referencia para este pedido</p>
          <button className={styles.btnUpload}>
            <FiUpload />
            Subir imagen
          </button>
        </div>
      </section>

      {/* ── Tabla de detalle ── */}
      <section className={styles.cardSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Detalle del pedido</h3>
          <button className={styles.btnAdd}>
            <FiPlus />
            Añadir detalle
          </button>
        </div>

        {detalles.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.detalleTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre - Producto</th>
                  <th>Cantidad</th>
                  <th>En producción</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d) => (
                  <tr key={d.detalle_id}>
                    <td className={styles.cellId}>{d.detalle_id}</td>
                    <td>{d.producto?.nombre || '—'}</td>
                    <td className={styles.cellQty}>{d.cantidad}</td>
                    <td>
                      <span className={`${styles.prodBadge} ${(d.in_produccion?.length || 0) > 0 ? styles.prodSi : styles.prodNo}`}>
                        {(d.in_produccion?.length || 0) > 0 ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.rowBtn} title="Ver más"><FiEye /></button>
                        <button className={`${styles.rowBtn} ${styles.rowBtnDanger}`} title="Eliminar detalle"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.tableEmpty}>
            <FiImage className={styles.tableEmptyIcon} />
            <p className={styles.tableEmptyText}>No hay detalles asociados a este pedido</p>
            <p className={styles.tableEmptySub}>Agrega productos al pedido usando el botón "Añadir detalle"</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DetallePedido;
