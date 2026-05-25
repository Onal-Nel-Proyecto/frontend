// ================================================================
// LoadingOverlay — Overlay de carga que se muestra mientras se
// procesa una petición al servidor.
// ================================================================

import { motion } from 'framer-motion';
import styles from './loadingOverlay.module.css';

const LoadingOverlay = ({ title = 'Guardando…', message = 'Por favor espera un momento' }) => (
  <motion.div
    className={styles.overlay}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className={styles.card}>
      <motion.div
        className={styles.spinner}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </div>
  </motion.div>
);

export default LoadingOverlay;
