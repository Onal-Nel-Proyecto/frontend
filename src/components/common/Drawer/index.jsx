// ================================================================
// Drawer — Panel deslizable desde la derecha
// Basado en el diseño de RegisterClient.jsx
// ================================================================

import { useEffect, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import styles from './drawer.module.css';

const Drawer = ({ isOpen, onClose, title, subtitle, icon, children, footer }) => {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {icon && <div className={styles.headerIcon}>{icon}</div>}
            <div>
              <h2 className={styles.title}>{title}</h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <FiX />
          </button>
        </div>

        {/* Contenido */}
        <div className={styles.body}>{children}</div>

        {/* Footer */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Drawer;
