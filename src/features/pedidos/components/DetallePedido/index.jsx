// ================================================================
// DetallePedido — Sub-página de detalle del pedido (index)
// ================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FiPlus, FiUpload, FiEye, FiTrash2, FiImage, FiPackage,
  FiDownload, FiX,
} from 'react-icons/fi';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { deleteDetalle, uploadFotoPedido, deleteFotoPedido } from '../../services/pedidosService';
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
  const API_URL = import.meta.env.VITE_API_URL || '';
  console.log(`${API_URL}${pedido.fotos_pedido[0]?.foto_url}`)
  // Cargar fotos existentes del pedido desde la API
  useEffect(() => {
    if (pedido.fotos_pedido?.length > 0) {
      setImages(pedido.fotos_pedido.map((f) => ({
        id: f.foto_id,
        foto_id: f.foto_id,
        preview: `${API_URL}${f.foto_url}`,
        // preview: `${f.foto_url}`,
        name: f.foto_url.split('/').pop() || `foto-${f.foto_id}`,
        isExisting: true,
      })));
    } else {
      setImages([]);
    }
  }, [pedido?.pedido_id]);

  const handleFileSelect = useCallback(async (e) => {
    const MAX_SIZE_MB = 5;
    const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];  // Solo formatos permitidos por backend

    const files = Array.from(e.target.files);
    let subidas = 0;
    let errores = [];

    for (const file of files) {
      // Validar tipo MIME
      if (!VALID_TYPES.includes(file.type)) {
        errores.push(`"${file.name}": formato no soportado (use JPG, PNG, WebP o GIF)`);
        continue;
      }
      // Validar tamaño máximo
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errores.push(`"${file.name}": supera el límite de ${MAX_SIZE_MB}MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('foto', file);
        const resp = await uploadFotoPedido(pedido.pedido_id, formData);
        if (resp?.status) {
          subidas++;
          // Añadir la imagen al estado local inmediatamente
          const fotoData = resp?.data;
          if (fotoData?.foto_id) {
            setImages((prev) => [
              ...prev,
              {
                id: fotoData.foto_id,
                foto_id: fotoData.foto_id,
                preview: `${API_URL}${fotoData.foto_url}`,
                name: fotoData.foto_url?.split('/').pop() || file.name,
                isExisting: true,
              },
            ]);
          } else {
            // Fallback: preview local si el server no devuelve la url
            setImages((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                foto_id: null,
                preview: URL.createObjectURL(file),
                name: file.name,
                isExisting: false,
              },
            ]);
          }
        } else {
          errores.push(`"${file.name}": el servidor rechazó la subida`);
        }
      } catch (err) {
        errores.push(`"${file.name}": ${err?.response?.data?.error || 'error de conexión'}`);
      }
    }

    // Mostrar resultado con el Alert del sistema
    if (subidas > 0) {
      setResultAlert({
        type: 'success',
        title: `Foto${subidas > 1 ? 's' : ''} subida${subidas > 1 ? 's' : ''}`,
        message: `${subidas} foto${subidas > 1 ? 's' : ''} subida${subidas > 1 ? 's' : ''} correctamente`,
        onClose: () => { setResultAlert(null); window.location.reload(); },
      });
    }
    if (errores.length > 0) {
      setResultAlert({
        type: 'error',
        title: `Error al subir ${errores.length > 1 ? 'fotos' : 'foto'}`,
        message: errores.join(' • '),
        onClose: () => setResultAlert(null),
      });
    }

    e.target.value = '';
  }, [pedido.pedido_id, API_URL, setImages]);

  const handleDeleteImage = useCallback(async (id, fotoId) => {
    // Remover del estado local inmediatamente (se ve al instante)
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
    if (viewerImage?.id === id) setViewerImage(null);

    if (fotoId) {
      // Es una foto existente del backend → eliminar vía API
      try {
        const resp = await deleteFotoPedido(pedido.pedido_id, fotoId);
        if (resp?.status) {
          setResultAlert({
            type: 'success',
            title: 'Foto eliminada',
            message: 'La foto se eliminó correctamente',
            onClose: () => { setResultAlert(null); window.location.reload(); },
          });
        } else {
          setResultAlert({
            type: 'error',
            title: 'Error',
            message: resp?.msg || 'No se pudo eliminar la foto',
            onClose: () => setResultAlert(null),
          });
        }
      } catch (err) {
        setResultAlert({
          type: 'error',
          title: 'Error',
          message: err?.response?.data?.error || 'Error de conexión al eliminar la foto',
          onClose: () => setResultAlert(null),
        });
      }
    }
  }, [viewerImage, pedido.pedido_id, setImages]);

  const handleDownloadImage = useCallback(async (image) => {
    if (image.preview.startsWith('blob:')) {
      // Imagen local (preview) — descarga directa
      const link = document.createElement('a');
      link.href = image.preview;
      link.download = image.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Imagen del servidor — fetch como blob para evitar redirección
      try {
        const response = await fetch(image.preview);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = image.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback: abrir en nueva pestaña
        window.open(image.preview, '_blank');
      }
    }
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

      {/* Tipo de pedido */}
      <section className={styles.cardSection}>
        <div className={styles.tipoPedidoRow}>
          <span className={styles.tipoPedidoLabel}>Tipo de pedido:</span>
          <span className={styles.tipoPedidoValue}>
            {pedido.tipo_pedido
              ? pedido.tipo_pedido === 'personalizado' ? 'Personalizado'
                : pedido.tipo_pedido === 'retoques' ? 'Retoques'
                : pedido.tipo_pedido === 'modificaciones' ? 'Modificaciones'
                : pedido.tipo_pedido
              : '—'}
          </span>
        </div>
      </section>

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
                    <th>Precio Unitario</th>
                    <th>Total</th>
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
                      <td className={styles.cellPrice}>${Number(d.producto?.precio || 0).toLocaleString()}</td>
                      <td className={styles.cellPrice}>${Number(d.cantidad * (d.producto?.precio || 0)).toLocaleString()}</td>
                      <td>
                        <span className={`${styles.prodBadge} ${(d.in_produccion || []).some(p => p.estado?.toUpperCase() !== 'CANCELADO') ? styles.prodSi : styles.prodNo}`}>
                          {(d.in_produccion || []).some(p => p.estado?.toUpperCase() !== 'CANCELADO') ? 'Sí' : 'No'}
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
                      <span className={styles.detalleMobileLabel}>Precio Unitario</span>
                      <span className={styles.detalleMobileValue}>${Number(d.producto?.precio || 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.detalleMobileRow}>
                      <span className={styles.detalleMobileLabel}>Total</span>
                      <span className={styles.detalleMobileValue}>${Number(d.cantidad * (d.producto?.precio || 0)).toLocaleString()}</span>
                    </div>
                    <div className={styles.detalleMobileRow}>
                      <span className={styles.detalleMobileLabel}>En producción</span>
                      <span className={`${styles.prodBadge} ${(d.in_produccion || []).some(p => p.estado?.toUpperCase() !== 'CANCELADO') ? styles.prodSi : styles.prodNo}`}>
                        {(d.in_produccion || []).some(p => p.estado?.toUpperCase() !== 'CANCELADO') ? 'Sí' : 'No'}
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

        <p className={styles.referencesInfo}>
          Formatos: JPEG, PNG, GIF, WEBP — Máx. 5MB por imagen — Máx. 15 imágenes
        </p>

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
            {images.length < 15 && (
              <button
                className={styles.btnUpload}
                disabled={isCanceled}
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload />
                Subir imagen
              </button>
            )}
          </div>
        ) : (
          <>
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
                    onClick={() => handleDeleteImage(img.id, img.foto_id)}
                    title="Eliminar imagen"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
              {images.length < 15 && (
                <button
                  className={styles.btnUploadImage}
                  disabled={isBloqueado}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload />
                </button>
              )}
            </div>
            <p className={styles.referencesCounter}>
              {images.length}/15
            </p>
          </>
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
                onClick={() => handleDeleteImage(viewerImage.id, viewerImage.foto_id)}
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
