// ================================================================
// NotificacionModal — Modal que muestra la información extra
// de una alerta. Renderiza dinámicamente todas las keys de info_extra.
// ================================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import styles from "./notificacionModal.module.css";

const formatearValor = (valor) => {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (valor instanceof Date || (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T/.test(valor))) {
    try {
      return new Date(valor).toLocaleString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(valor);
    }
  }
  if (typeof valor === "object") return JSON.stringify(valor, null, 2);
  return String(valor);
};

const labelHumano = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const NotificacionModal = ({ alerta, onClose }) => {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (alerta) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [alerta, onClose]);

  if (!alerta) return null;

  const infoExtra = alerta.info_extra || {};

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
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className={styles.modalHeader}>
            <div>
              <h3 className={styles.modalTitle}>{alerta.titulo}</h3>
              <span className={styles.modalTipo}>{alerta.tipo_alerta}</span>
              <span className={styles.modalModulo}>{alerta.modulo}</span>
            </div>
            <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
              <FiX />
            </button>
          </div>

          {/* Mensaje principal */}
          <div className={styles.modalMensaje}>
            <p>{alerta.mensaje}</p>
          </div>

          {/* Información extra dinámica */}
          {Object.keys(infoExtra).length > 0 && (
            <div className={styles.infoGrid}>
              <h4 className={styles.infoTitle}>Información adicional</h4>
              {Object.entries(infoExtra).map(([key, value]) => (
                <div key={key} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{labelHumano(key)}</span>
                  <span className={styles.infoValue}>{formatearValor(value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Metadatos */}
          <div className={styles.modalMeta}>
            {alerta.referencia_id && (
              <span className={styles.metaItem}>
                Referencia: <strong>{alerta.referencia_id}</strong>
              </span>
            )}
            {alerta.fecha && (
              <span className={styles.metaItem}>
                {new Date(alerta.fecha).toLocaleString("es-CO")}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default NotificacionModal;
