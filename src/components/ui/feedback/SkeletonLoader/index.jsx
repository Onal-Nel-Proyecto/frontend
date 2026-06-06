// ================================================================
// SkeletonLoader — Componentes de esqueleto animado para carga
// Reemplazan el texto "Cargando…" con placeholders visuales.
// ================================================================

import styles from "./skeleton.module.css";

/**
 * Esqueleto de tabla (listado de pedidos, entregas, etc.)
 */
export const TableSkeleton = ({ rows = 5 }) => (
  <div className={styles.tableSkeleton} role="status" aria-label="Cargando contenido">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.tableRow}>
        <div className={`${styles.skeleton} ${styles.tableCellNarrow}`} />
        <div className={`${styles.skeleton} ${styles.tableCellWide}`} />
        <div className={`${styles.skeleton} ${styles.tableCell}`} />
        <div className={`${styles.skeleton} ${styles.tableCell}`} />
        <div className={`${styles.skeleton} ${styles.tableCellNarrow}`} />
        <div className={`${styles.skeleton} ${styles.tableCellNarrow}`} />
      </div>
    ))}
  </div>
);

/**
 * Esqueleto de card (detalle, perfil, etc.)
 */
export const CardSkeleton = ({ lines = 4 }) => (
  <div className={styles.cardSkeleton} role="status" aria-label="Cargando contenido">
    <div className={`${styles.skeleton} ${styles.cardHeader}`} />
    <div className={styles.cardBody}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles.cardLine} ${i === lines - 1 ? styles.cardLineShort : ''}`}
        />
      ))}
    </div>
  </div>
);

/**
 * Esqueleto de dashboard (KPIs)
 */
export const DashSkeleton = ({ cards = 4 }) => (
  <div className={styles.dashSkeleton} role="status" aria-label="Cargando dashboard">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className={`${styles.skeleton} ${styles.dashCard}`} />
    ))}
  </div>
);

/**
 * Esqueleto de formulario
 */
export const FormSkeleton = ({ fields = 3 }) => (
  <div className={styles.formSkeleton} role="status" aria-label="Cargando formulario">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className={styles.formField}>
        <div className={`${styles.skeleton} ${styles.formLabel}`} />
        <div className={`${styles.skeleton} ${styles.formInput}`} />
      </div>
    ))}
  </div>
);

/**
 * Esqueleto genérico — tamaño personalizable
 */
export const SkeletonBlock = ({ width = "100%", height = "1rem", borderRadius = "6px" }) => (
  <div
    className={styles.skeleton}
    style={{ width, height, borderRadius }}
    role="status"
    aria-label="Cargando"
  />
);
