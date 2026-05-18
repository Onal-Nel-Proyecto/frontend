// ================================================================
// NotificationsDropdown — Menú de notificaciones
// Aparece al hacer clic en el icono FiBell del Header.
// Por ahora muestra un mensaje de "sin notificaciones".
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { FiBell, FiInbox } from 'react-icons/fi';
import Card from '../../common/Card';
import styles from './userDropdown.module.css';

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* Botón campana */}
      <button
        className={`${styles.trigger} ${open ? styles.triggerActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Notificaciones"
      >
        <FiBell />
      </button>

      {/* Card desplegable con estado vacío */}
      {open && (
        <Card className={styles.dropdown} as="div">
          <h4 className={styles.notifTitle}>Notificaciones</h4>
          <div className={styles.notifEmpty}>
            <FiInbox className={styles.notifIcon} />
            <p className={styles.notifText}>
              No hay notificaciones ni alertas registradas
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationsDropdown;
