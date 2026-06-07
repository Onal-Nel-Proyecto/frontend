// ================================================================
// Alert — Componente para mensajes de feedback al usuario
// Soporta tres variantes: success, error, confirm.
// Uso:
//   <Alert
//     type="success" | "error" | "confirm"
//     title="Mensaje opcional"
//     message="Descripción del mensaje"
//     onConfirm={fn}    // solo para confirm
//     onCancel={fn}     // solo para confirm
//     onClose={fn}      // success / error
//   />
// ================================================================

import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import styles from './alert.module.css';

const icons = {
  success: <FiCheckCircle />,
  error:   <FiAlertCircle />,
  confirm: <FiAlertTriangle />,
};

const Alert = ({ type = 'success', title, message, children, onConfirm, onCancel, onClose }) => {
  const isConfirm = type === 'confirm';
  const handleClose = onClose || (() => {});
  const handleCancel = onCancel || (() => {});

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isConfirm ? handleCancel : handleClose}
      >
        <motion.div
          className={`${styles.card} ${styles[type]}`}
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icono */}
          <div className={styles.iconWrapper}>
            {icons[type]}
          </div>

          {/* Contenido */}
          <div className={styles.body}>
            {title && <h4 className={styles.title}>{title}</h4>}
            {message && <p className={styles.message}>{message}</p>}
            {children}
          </div>

          {/* Acciones */}
          <div className={styles.actions}>
            {isConfirm ? (
              <>
                <button className={styles.btnCancel} onClick={handleCancel}>
                  Cancelar
                </button>
                <button className={styles.btnConfirm} onClick={onConfirm}>
                  Confirmar
                </button>
              </>
            ) : (
              <button className={styles.btnClose} onClick={handleClose}>
                <FiX /> Cerrar
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Alert;
