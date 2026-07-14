// ================================================================
// EntregasModal — Modal de detalle de una entrega.
// Muestra información general, datos del cliente, productos
// entregados, histórico de pagos y saldo pendiente.
// Incluye acción "Mantener en inventario" para pedidos TERMINADO.
// ================================================================

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPackage, FiDollarSign, FiCalendar, FiUser, FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { devolverPedido } from '../../services/pedidosService';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import styles from './EntregasModal.module.css';

import { formatCurrency } from '../../../../utils/format';

// ─── Helpers ──────────────────────────────────────────────────

const statusPayment = {
  'PAGADO':     { label: 'Pagado',     className: 'paid' },
  'ABONADO':    { label: 'Abonado',    className: 'partial' },
  'SIN PAGAR':  { label: 'Sin pagar',  className: 'unpaid' },
};

const statusOrder = {
  'ENTREGADO':  { label: 'Entregado',  className: 'delivered' },
  'TERMINADO':  { label: 'Terminado',  className: 'finished' },
};

// ─── Componente ───────────────────────────────────────────────

const EntregasModal = ({ entrega, onClose }) => {
  // ─── Estado para "Mantener en inventario" ───
  const [showConfirm, setShowConfirm] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showConfirm) {
          setShowConfirm(false);
          setMotivo('');
          setMotivoError('');
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, showConfirm]);

  // ─── Confirmar mantener en inventario ───
  const handleConfirm = async () => {
    const trimmed = motivo.trim();
    if (!trimmed) {
      setMotivoError('El motivo es obligatorio');
      return;
    }
    setMotivoError('');
    setShowConfirm(false);
    setSaving(true);

    try {
      const resp = await devolverPedido(entrega.id || entrega.pedido_id, {
        tipo_devolucion: 'ANULACION',
        motivo: trimmed,
      });

      setSaving(false);

      if (resp?.status) {
        setResult({
          type: 'success',
          title: 'Pedido mantenido en inventario',
          message: resp.msg || `El pedido #${entrega.id} ha sido devuelto al inventario correctamente.`,
          onClose: () => window.location.reload(),
        });
      } else {
        setResult({
          type: 'error',
          title: 'Error',
          message: resp?.msg || 'Error al procesar la solicitud',
          onClose: () => setResult(null),
        });
      }
    } catch (err) {
      setSaving(false);
      setResult({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo procesar la solicitud',
        onClose: () => setResult(null),
      });
    }
  };

  const sp = statusPayment[entrega.estado_pago] || {};
  const so = statusOrder[entrega.estado] || {};
  const esTerminado = entrega.estado === 'TERMINADO';

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!showConfirm) onClose();
        }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative' }}
        >
          {/* ─── Header ─── */}
          <div className={styles.modalHeader}>
            <div>
              <h3 className={styles.modalTitle}>Pedido #{entrega.id}</h3>
              <span className={`${styles.badge} ${styles[so.className] || ''}`}>
                {so.label || entrega.estado}
              </span>
              <span className={`${styles.badge} ${styles[sp.className] || ''}`} style={{ marginLeft: '0.4rem' }}>
                {sp.label || entrega.estado_pago}
              </span>
            </div>
            <button className={styles.closeBtn} onClick={() => {
              if (!showConfirm) onClose();
            }} title="Cerrar">
              <FiX />
            </button>
          </div>

          {/* ─── Cuerpo ─── */}
          <div className={styles.modalBody}>
            {/* Cliente */}
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}><FiUser /> Cliente</h4>
              <p className={styles.infoText}>{entrega.cliente_nombres}</p>
            </div>

            {/* Fechas */}
            <div className={styles.infoRow}>
              <div className={styles.infoSection}>
                <h4 className={styles.sectionTitle}><FiCalendar /> Fecha de estimada de entrega</h4>
                <p className={styles.infoText}>{entrega.fecha_entrega_estimada}</p>
              </div>
              <div className={styles.infoSection}>
                <h4 className={styles.sectionTitle}><FiCalendar /> Fecha de entrega</h4>
                <p className={styles.infoText}>{entrega.fecha_entrega_real}</p>
              </div>
            </div>

            {/* Productos entregados */}
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}><FiPackage /> Productos entregados</h4>
              <table className={styles.productsTable}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.colRight}>Cantidad</th>
                    <th className={styles.colRight}>Precio</th>
                    <th className={styles.colRight}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {entrega.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.producto}</td>
                      <td className={styles.colRight}>{item.cantidad}</td>
                      <td className={styles.colRight}>{formatCurrency(item.precio)}</td>
                      <td className={styles.colRight}>{formatCurrency(item.cantidad * item.precio)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className={styles.totalLabel}>Total</td>
                    <td className={styles.totalValue}>{formatCurrency(entrega.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Historial de pagos */}
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}><FiDollarSign /> Historial de pagos</h4>
              {entrega.pagos?.length > 0 ? (
                <table className={styles.productsTable}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entrega.pagos.map((pago, i) => {
                      const est = (pago.estado || 'COMPLETADO').toUpperCase();
                      const statusCls =
                        est === 'COMPLETADO' ? styles.statusCompletado :
                        est === 'RECHAZADO'  ? styles.statusRechazado :
                        est === 'PENDIENTE'  ? styles.statusPendiente :
                        est === 'ANULADO'    ? styles.statusAnulado :
                        styles.statusCompletado;
                      return (
                        <tr key={i}>
                          <td>{pago.fecha}</td>
                          <td className={styles.colRight}>{formatCurrency(Number(pago.monto ?? 0))}</td>
                          <td>{pago.metodo}</td>
                          <td><span className={statusCls}>{est.charAt(0) + est.slice(1).toLowerCase()}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className={styles.totalLabel}>Total pagado</td>
                      <td className={styles.totalValue}>
                        {formatCurrency(entrega.pagos
                          .filter(p => (p.estado || 'COMPLETADO').toUpperCase() === 'COMPLETADO')
                          .reduce((sum, p) => sum + Number(p.monto ?? 0), 0)
                        )}
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className={styles.emptyText}>No hay pagos registrados</p>
              )}
            </div>

            {/* Saldo pendiente */}
            <div className={`${styles.saldoBox} ${entrega.saldo_pendiente > 0 ? styles.saldoDue : styles.saldoClear}`}>
              <span className={styles.saldoLabel}>Saldo pendiente</span>
              <span className={styles.saldoValue}>{formatCurrency(entrega.saldo_pendiente)}</span>
            </div>

            {/* ─── Botón "Mantener en inventario" ─── */}
            {esTerminado && !showConfirm && !result && (
              <div className={styles.inventoryBtnWrap}>
                <button
                  className={styles.btnInventory}
                  onClick={() => setShowConfirm(true)}
                  title="Mantener el pedido en el inventario"
                >
                  <FiArchive />
                  Mantener en inventario
                </button>
              </div>
            )}

            {/* ─── Confirmación interna ─── */}
            {showConfirm && (
              <div className={styles.confirmOverlay}>
                <div className={styles.confirmBox}>
                  <h4 className={styles.confirmTitle}>
                    <FiAlertTriangle />
                    ¿Mantener en inventario?
                  </h4>
                  <p className={styles.confirmDesc}>
                    El pedido <strong>#{entrega.id}</strong> volverá a estar disponible
                    en el inventario. Esta acción registrará una devolución tipo anulación.
                  </p>

                  <label className={styles.confirmLabel}>
                    Motivo <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    className={`${styles.confirmTextarea} ${motivoError ? styles.confirmTextareaError : ''}`}
                    placeholder="Describe el motivo por el cual se mantiene en inventario…"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      if (motivoError) setMotivoError('');
                    }}
                    rows={3}
                    maxLength={300}
                    autoFocus
                  />
                  {motivoError && (
                    <span className={styles.confirmError}>{motivoError}</span>
                  )}
                  <span className={styles.confirmCharCounter}>
                    {motivo.length}/300
                  </span>

                  <div className={styles.confirmActions}>
                    <button
                      className={styles.confirmBtnCancel}
                      onClick={() => {
                        setShowConfirm(false);
                        setMotivo('');
                        setMotivoError('');
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className={styles.confirmBtnConfirm}
                      onClick={handleConfirm}
                      disabled={saving}
                    >
                      {saving ? 'Procesando…' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Loading y resultado ─── */}
      {saving && <LoadingOverlay title="Procesando…" message="Registrando devolución del pedido" />}
      {result && (
        <Alert type={result.type} title={result.title} message={result.message} onClose={result.onClose} />
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EntregasModal;
