// ================================================================
// ConnectionBanner — Barra que indica pérdida de conectividad
// con el backend o desconexión de red del navegador.
// ================================================================

import { useState, useEffect } from "react";
import { FiWifi, FiWifiOff } from "react-icons/fi";
import styles from "./connectionBanner.module.css";

/**
 * Detecta el estado de conexión del navegador (navigator.onLine)
 * y escucha eventos personalizados de error de red desde axiosInstance.
 */
const ConnectionBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    // Estado del navegador
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Evento personalizado desde axiosInstance
    const handleBackendError = () => setBackendError(true);
    const handleBackendRecover = () => setBackendError(false);

    window.addEventListener("connectionError", handleBackendError);
    window.addEventListener("connectionRecover", handleBackendRecover);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("connectionError", handleBackendError);
      window.removeEventListener("connectionRecover", handleBackendRecover);
    };
  }, []);

  // Auto-ocultar error del backend después de 8 segundos
  useEffect(() => {
    if (!backendError) return;
    const timer = setTimeout(() => setBackendError(false), 8000);
    return () => clearTimeout(timer);
  }, [backendError]);

  if (!offline && !backendError) return null;

  const mensaje = offline
    ? "Sin conexión a internet — algunos datos pueden no estar disponibles"
    : "Error de conexión con el servidor — reintentando…";

  return (
    <div
      className={`${styles.banner} ${offline ? styles.bannerOffline : styles.bannerBackend}`}
      role="alert"
    >
      {offline ? <FiWifiOff /> : <FiWifi />}
      <span className={styles.text}>{mensaje}</span>
    </div>
  );
};

export default ConnectionBanner;
