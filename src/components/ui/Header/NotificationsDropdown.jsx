// ================================================================
// NotificationsDropdown — Menú de notificaciones en tiempo real
//
// - Badge con contador (+15 si supera 15)
// - Dropdown con cards de alertas (icono por módulo, color por tipo)
// - Paginación con "ver más"
// - Modal de información extra
// - Botón de redirección por módulo
// - Diseño responsive (fullscreen en mobile/tablet)
// ================================================================

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiInbox,
  FiDollarSign,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiAlertCircle,
  FiExternalLink,
  FiChevronDown,
  FiX,
} from "react-icons/fi";
import useAlertas from "../../../hooks/useAlertas";
import NotificacionModal from "../NotificacionModal/NotificacionModal";
import styles from "./notificationsDropdown.module.css";

// ─── Mapa de módulo → icono ───
const iconoModulo = {
  PAGOS: <FiDollarSign />,
  PEDIDOS: <FiShoppingBag />,
  INVENTARIO: <FiPackage />,
  USUARIOS: <FiUsers />,
  GENERAL: <FiAlertCircle />,
};

const iconoPorModulo = (modulo) =>
  iconoModulo[modulo?.toUpperCase()] || <FiAlertCircle />;

// ─── Mapa de tipo_alerta → colores ───
const colorTipo = {
  ERROR: { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" },
  WARNING: { bg: "#fffbeb", text: "#f59e0b", border: "#fde68a" },
  INFO: { bg: "#eff6ff", text: "#3b82f6", border: "#bfdbfe" },
};

const colorPorTipo = (tipo) => colorTipo[tipo?.toUpperCase()] || colorTipo.INFO;

// ─── Calcular tiempo relativo ───
const tiempoRelativo = (fechaISO) => {
  if (!fechaISO) return "";
  const ahora = new Date();
  const fecha = new Date(fechaISO);
  const diffMs = ahora - fecha;

  if (diffMs < 0) return "recién";

  const segundos = Math.floor(diffMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  const semanas = Math.floor(dias / 7);
  const meses = Math.floor(dias / 30);
  const años = Math.floor(dias / 365);

  if (segundos < 60) return "hace unos segundos";
  if (minutos < 60) return `hace ${minutos} min`;
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  if (dias < 7) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
  if (semanas < 5) return `hace ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  return `hace ${años} ${años === 1 ? "año" : "años"}`;
};

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [alertaModal, setAlertaModal] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const ref = useRef(null);
  const portalRef = useRef(null);
  const navigate = useNavigate();

  const {
    alertas,
    loading,
    cargandoMas,
    hayMas,
    totalAlertas,
    cargarMas,
  } = useAlertas({ limite: 15 });

  // Detectar mobile
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Cerrar al hacer clic fuera (solo si NO hay un modal activo)
  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      // Si el modal de información extra está abierto, no cerrar el menú
      if (alertaModal) return;

      // Desktop: el dropdown está dentro del wrapper
      if (!isMobile && ref.current && !ref.current.contains(e.target)) {
        console.log("[NotifDropdown] click fuera (desktop), cerrando");
        setOpen(false);
        return;
      }
      // Mobile: el dropdown está portaleado al body
      if (isMobile && portalRef.current && !portalRef.current.contains(e.target)) {
        console.log("[NotifDropdown] click fuera (mobile), cerrando");
        setOpen(false);
      }
    };

    // Pequeño retardo para evitar que el mismo clic que abrió cierre el dropdown
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, isMobile, alertaModal]);

  // Badge: si > 15 mostrar "+15"
  const badgeTexto = useMemo(() => {
    if (totalAlertas === 0) return null;
    return totalAlertas > 15 ? "+15" : totalAlertas;
  }, [totalAlertas]);

  // ─── Contenido compartido del dropdown (sin wrapper motion, solo el interior) ───
  const dropdownInner = (
    <>
      {/* Header del dropdown */}
      <div className={styles.header}>
        <h4 className={styles.headerTitle}>Notificaciones</h4>
        {totalAlertas > 0 && (
          <span className={styles.headerCount}>
            {totalAlertas} {totalAlertas === 1 ? "alerta" : "alertas"}
          </span>
        )}
        {isMobile && (
          <button
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            title="Cerrar"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Lista de alertas */}
      <div className={styles.lista}>
        {loading ? (
          <div className={styles.loaderDots}>
            <span className={styles.loaderDot} />
            <span className={styles.loaderDot} />
            <span className={styles.loaderDot} />
          </div>
        ) : alertas.length === 0 ? (
          <div className={styles.emptyState}>
            <FiInbox className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              No hay notificaciones ni alertas registradas
            </p>
          </div>
        ) : (
          alertas.map((alerta) => (
            <AlertaCard
              key={alerta.id_alerta}
              alerta={alerta}
              onVerInfo={setAlertaModal}
              onRedirect={(alerta) => {
                setOpen(false);
                // Si la alerta tiene venta_id en info_extra, redirigir a ventas
                const ventaId = alerta.info_extra?.venta_id || alerta.accion?.venta_id;
                if (ventaId) {
                  navigate(`/ventas/reportes`);
                } else if (alerta.accion?.url) {
                  navigate(alerta.accion.url);
                }
              }}
            />
          ))
        )}
      </div>

      {/* Botón "Ver más" */}
      {hayMas && (
        <div className={styles.verMasWrapper}>
          <button
            className={styles.verMasBtn}
            onClick={cargarMas}
            disabled={cargandoMas}
          >
            {cargandoMas ? (
              <span className={styles.loaderDots} style={{ padding: 0 }}>
                <span className={styles.loaderDot} />
                <span className={styles.loaderDot} />
                <span className={styles.loaderDot} />
              </span>
            ) : (
              <>Ver más <FiChevronDown style={{ verticalAlign: "middle" }} /></>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* ─── Botón campana con badge ─── */}
      <button
        className={`${styles.trigger} ${open ? styles.triggerActive : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <FiBell />
        {badgeTexto !== null && (
          <span className={styles.badge}>{badgeTexto}</span>
        )}
      </button>

      {/* ─── Dropdown: desktop (absoluto dentro del wrapper) ─── */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {dropdownInner}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── Dropdown: mobile (portaleado a document.body para evitar backdrop-filter) ─── */}
      {isMobile && open && createPortal(
        <motion.div
          className={`${styles.dropdown} ${styles.dropdownMobile}`}
          ref={portalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {dropdownInner}
        </motion.div>,
        document.body
      )}

      {/* ─── Modal de información extra (siempre portaleado) ─── */}
      <NotificacionModal
        alerta={alertaModal}
        onClose={() => setAlertaModal(null)}
      />
    </div>
  );
};

// ================================================================
// SUB-COMPONENTE: Card de alerta individual
// ================================================================

const AlertaCard = ({ alerta, onVerInfo, onRedirect }) => {
  const colores = colorPorTipo(alerta.tipo_alerta);
  const icono = iconoPorModulo(alerta.modulo);
  const tiempo = tiempoRelativo(alerta.fecha);
  const tieneInfoExtra = alerta.info_extra && Object.keys(alerta.info_extra).length > 0;
  const tieneAccion = alerta.accion && alerta.accion.url;

  return (
    <div className={styles.card}>
      {/* Icono del módulo */}
      <div
        className={styles.cardIcon}
        style={{
          background: colores.bg,
          color: colores.text,
          borderColor: colores.border,
        }}
      >
        {icono}
      </div>

      {/* Cuerpo */}
      <div className={styles.cardBody}>
        <p className={styles.cardTitle}>{alerta.titulo}</p>

        <div className={styles.cardMsgTooltip}>
          <p className={styles.cardMsg}>{alerta.mensaje}</p>
        </div>

        <span className={styles.cardTime}>{tiempo}</span>

        {/* Acciones */}
        {(tieneInfoExtra || tieneAccion) && (
          <div className={styles.cardActions}>
            {tieneInfoExtra && (
              <button
                className={styles.infoBtn}
                onClick={() => onVerInfo(alerta)}
              >
                Ver información extra
              </button>
            )}

            {tieneAccion && (
              <div className={styles.redirectBtnWrapper}>
                <button
                  className={styles.redirectBtn}
                  onClick={() => onRedirect(alerta)}
                  title={alerta.accion.texto || "Ir"}
                >
                  <FiExternalLink />
                </button>
                {alerta.accion.texto && (
                  <span className={styles.redirectTooltip}>
                    {alerta.accion.texto}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
