// ================================================================
// EntregasModal — Modal de detalle de una entrega.
// Muestra información general, datos del cliente, productos
// entregados, histórico de pagos y saldo pendiente.
// ================================================================

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPackage, FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';
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
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  console.log(entrega);
  
  const sp = statusPayment[entrega.estado_pago] || {};
  const so = statusOrder[entrega.estado] || {};

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
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
            <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
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
                    </tr>
                  </thead>
                  <tbody>
                    {entrega.pagos.map((pago, i) => (
                      <tr key={i}>
                        <td>{pago.fecha}</td>
                        <td className={styles.colRight}>{formatCurrency(Number(pago.monto ?? 0))}</td>
                        <td>{pago.metodo}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className={styles.totalLabel}>Total pagado</td>
                      <td className={styles.totalValue}>
                        {formatCurrency(entrega.pagos.reduce((sum, p) => sum + Number(p.monto ?? 0), 0))}
                      </td>
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EntregasModal;
