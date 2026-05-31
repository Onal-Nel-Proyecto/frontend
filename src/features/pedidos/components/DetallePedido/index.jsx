// ================================================================
// DetallePedido — Sub-página de detalle del pedido (index)
// ================================================================

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiPlus, FiUpload, FiEye, FiTrash2, FiImage, FiPackage } from 'react-icons/fi';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { deleteDetalle } from '../../services/pedidosService';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const DetallePedido = () => {
  const { pedido, openDetallePanel, isCanceled } = useOutletContext();
  const detalles = pedido.detalles_pedido || [];
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resultAlert, setResultAlert] = useState(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    setDeleting(true);
    try {
      const resp = await deleteDetalle(pedido.pedido_id, id);
      setDeleting(false);
      if (resp?.status) {
        setResultAlert({
          type: 'success',
          title: 'Detalle eliminado',
          message: resp.msg || 'El detalle se eliminó correctamente',
          onClose: () => { setResultAlert(null); window.location.reload(); },
        });
      } else {
        setResultAlert({
          type: 'error',
          title: 'Error',
          message: resp?.msg || 'No se pudo eliminar el detalle',
          onClose: () => setResultAlert(null),
        });
      }
    } catch (err) {
      setDeleting(false);
      setResultAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo eliminar el detalle',
        onClose: () => setResultAlert(null),
      });
    }
  };

  return (
    <div className={styles.detalleContent}>

      {/* Tabla de detalle */}
      <section className={styles.cardSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Detalle del pedido</h3>
          <button
            className={styles.btnAdd}
            disabled={isCanceled}
            onClick={() => openDetallePanel({ open: true, modo: 'create', detalle: null })}
          >
            <FiPlus />
            Añadir detalle
          </button>
        </div>

        {detalles.length > 0 ? (
          <>
            {/* Vista escritorio — tabla */}
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
                          <button className={styles.rowBtn} title="Ver más" onClick={() => openDetallePanel({ open: true, modo: 'view', detalle: d })}>
                            <FiEye />
                          </button>
                          <button
                            className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                            title="Eliminar detalle"
                            disabled={isCanceled}
                            onClick={() => setDeleteTarget(d.detalle_id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil — cards */}
            <div className={styles.detalleMobileList}>
              {detalles.map((d) => (
                <div key={d.detalle_id} className={styles.detalleMobileCard}>
                  <div className={styles.detalleMobileHeader}>
                    <span className={styles.cellId}>#{d.detalle_id}</span>
                    <div className={styles.rowActions}>
                      <button className={styles.rowBtn} title="Ver más" onClick={() => openDetallePanel({ open: true, modo: 'view', detalle: d })}>
                        <FiEye />
                      </button>
                      <button
                        className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                        title="Eliminar detalle"
                        disabled={isCanceled}
                        onClick={() => setDeleteTarget(d.detalle_id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <div className={styles.detalleMobileBody}>
                    <div className={styles.detalleMobileRow}>
                      <span className={styles.detalleMobileLabel}>Producto</span>
                      <span className={styles.detalleMobileValue}>{d.producto?.nombre || '—'}</span>
                    </div>
                    <div className={styles.detalleMobileRow}>
                      <span className={styles.detalleMobileLabel}>Cantidad</span>
                      <span className={styles.detalleMobileValue}>{d.cantidad}</span>
                    </div>
                    <div className={styles.detalleMobileRow}>
                      <span className={styles.detalleMobileLabel}>En producción</span>
                      <span className={`${styles.prodBadge} ${(d.in_produccion?.length || 0) > 0 ? styles.prodSi : styles.prodNo}`}>
                        {(d.in_produccion?.length || 0) > 0 ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.tableEmpty}>
            <FiImage className={styles.tableEmptyIcon} />
            <p className={styles.tableEmptyText}>No hay detalles asociados a este pedido</p>
            <p className={styles.tableEmptySub}>Agrega productos al pedido usando el botón "Añadir detalle"</p>
          </div>
        )}
      </section>

       {/* Referencias */}
      <section className={styles.cardSection}>
        <h3 className={styles.sectionTitle}>Referencias</h3>
        <div className={styles.referencesEmpty}>
          <div className={styles.referencesIcon}><FiImage /></div>
          <p className={styles.referencesText}>No hay imágenes de referencia para este pedido</p>
          <button className={styles.btnUpload} disabled={isCanceled}>
            <FiUpload />
            Subir imagen
          </button>
        </div>
      </section>

      {/* Confirmación eliminar detalle */}
      {deleteTarget && (
        <Alert
          type="confirm"
          title="¿Eliminar detalle?"
          message="Esta acción no se puede deshacer."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Loading durante eliminación */}
      {deleting && <LoadingOverlay title="Eliminando detalle…" message="Procesando la solicitud" />}

      {/* Resultado de la eliminación */}
      {resultAlert && (
        <Alert type={resultAlert.type} title={resultAlert.title} message={resultAlert.message} onClose={resultAlert.onClose} />
      )}
    </div>
  );
};

export default DetallePedido;
