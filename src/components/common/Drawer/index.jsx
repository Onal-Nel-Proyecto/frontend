// ================================================================
// Drawer — Panel deslizable desde la derecha
// Renderizado con portal para que siempre esté por encima del header
// ================================================================

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import styles from './drawer.module.css';

const Drawer = ({ isOpen, onClose, title, subtitle, icon, children, footer }) => {
  const drawerRef = useFocusTrap(isOpen);
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

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.drawer} ref={drawerRef}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {icon && <div className={styles.headerIcon}>{icon}</div>}
            <div>
              <h2 className={styles.title}>{title}</h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar" autoFocus>
            <FiX />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className={styles.body}>{children}</div>

        {/* Footer siempre visible */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Drawer;
