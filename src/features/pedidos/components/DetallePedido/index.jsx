// ================================================================
// DetallePedido — Sub-página de detalle del pedido (index)
// ================================================================

import { useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FiPlus, FiUpload, FiEye, FiTrash2, FiImage, FiPackage,
  FiDownload, FiX,
} from 'react-icons/fi';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { deleteDetalle } from '../../services/pedidosService';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const DetallePedido = () => {
  const { pedido, openDetallePanel, isCanceled } = useOutletContext();
  const isEntregado = pedido.estado?.toUpperCase() === 'ENTREGADO';
  const isBloqueado = isCanceled || isEntregado;
  const detalles = pedido.detalles_pedido || [];
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resultAlert, setResultAlert] = useState(null);
  const [images, setImages] = useState([]);
  const [viewerImage, setViewerImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const MAX_SIZE_MB = 5;
    const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      // Validar tipo MIME real
      if (!VALID_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": formato no soportado (use JPG, PNG, WebP o GIF)`);
        continue;
      }
      // Validar tamaño máximo
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errors.push(`"${file.name}": supera el límite de ${MAX_SIZE_MB}MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    const newImages = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  }, []);

  const handleDeleteImage = useCallback((id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
    if (viewerImage?.id === id) setViewerImage(null);
  }, [viewerImage]);

  const handleDownloadImage = useCallback((image) => {
    const link = document.createElement('a');
    link.href = image.preview;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

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
            disabled={isBloqueado}
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
                            disabled={isBloqueado}
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
                        disabled={isBloqueado}
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

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.fileInputHidden}
          onChange={handleFileSelect}
        />

        {images.length === 0 ? (
          <div className={styles.referencesEmpty}>
            <div className={styles.referencesIcon}><FiImage /></div>
            <p className={styles.referencesText}>No hay imágenes de referencia para este pedido</p>
            <button
              className={styles.btnUpload}
              disabled={isCanceled}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload />
              Subir imagen
            </button>
          </div>
        ) : (
          <div className={styles.imageGallery}>
            {images.map((img) => (
              <div key={img.id} className={styles.imageThumbWrapper}>
                <img
                  src={img.preview}
                  alt={img.name}
                  className={styles.imageThumb}
                  onClick={() => setViewerImage(img)}
                />
                <button
                  className={styles.imageThumbDelete}
                  onClick={() => handleDeleteImage(img.id)}
                  title="Eliminar imagen"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <button
              className={styles.btnUploadImage}
              disabled={isBloqueado}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload />
            </button>
          </div>
        )}
      </section>

      {/* Modal visor de imagen */}
      {viewerImage && (
        <div
          className={styles.imageViewerOverlay}
          onClick={() => setViewerImage(null)}
        >
          <div
            className={styles.imageViewerModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.viewerActions}>
              <button
                className={styles.viewerBtn}
                onClick={() => handleDownloadImage(viewerImage)}
                title="Descargar imagen"
              >
                <FiDownload />
                Descargar
              </button>
              <button
                className={`${styles.viewerBtn} ${styles.viewerBtnDanger}`}
                onClick={() => handleDeleteImage(viewerImage.id)}
                title="Eliminar imagen"
              >
                <FiTrash2 />
                Eliminar
              </button>
              <button
                className={styles.viewerBtn}
                onClick={() => setViewerImage(null)}
                title="Cerrar"
              >
                <FiX />
                Cerrar
              </button>
            </div>
            <img
              src={viewerImage.preview}
              alt={viewerImage.name}
              className={styles.viewerImage}
            />
          </div>
        </div>
      )}

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
