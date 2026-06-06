// ================================================================
// useAlertas — Hook para obtener alertas con paginación y polling
// - fetchAlertas: obtiene una página (limpia o concatena)
// - cargarMas:   siguiente página, concatena resultados
// - refrescar:   vuelve a página 1
// - Polling automático cada 15 minutos
// ================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { getAlertas } from "../api/endpoints/alertasEndpoints";

// getSocket se importa dinámicamente dentro del useEffect para no cargar
// socket.io-client en páginas que no usan notificaciones en tiempo real.

const POLLING_INTERVAL = 60 * 1000; // 1 minuto (fallback si socket no funciona)

const useAlertas = ({ limite = 15, estado, tipo, categoria } = {}) => {
  const [alertas, setAlertas] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);

  const paginaRef = useRef(1);
  const mountedRef = useRef(true);

  /**
   * Obtener una página de alertas
   * @param {number} pagina - Número de página
   * @param {boolean} limpiar - Si true, reemplaza el array; si false, concatena
   */
  const fetchAlertas = useCallback(async (pagina, limpiar = true) => {
    try {
      if (limpiar) {
        setLoading(true);
      } else {
        setCargandoMas(true);
      }
      setError(null);

      const result = await getAlertas({
        pagina,
        limite,
        estado,
        tipo,
        categoria,
      });

      if (!mountedRef.current) return;

      setMeta(result.meta);

      if (limpiar) {
        setAlertas(result.data || []);
      } else {
        setAlertas((prev) => [...prev, ...(result.data || [])]);
      }

      paginaRef.current = pagina;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.error || err.message || "Error al cargar alertas");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setCargandoMas(false);
      }
    }
  }, [limite, estado, tipo, categoria]);

  /** Ir a la siguiente página */
  const cargarMas = useCallback(() => {
    if (cargandoMas || loading) return;
    const siguientePagina = paginaRef.current + 1;
    fetchAlertas(siguientePagina, false);
  }, [cargandoMas, loading, fetchAlertas]);

  /** Recargar desde página 1 */
  const refrescar = useCallback(() => {
    fetchAlertas(1, true);
  }, [fetchAlertas]);

  // Carga inicial
  useEffect(() => {
    mountedRef.current = true;
    fetchAlertas(1, true);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchAlertas]);

  // Polling cada 15 min
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAlertas(1, true);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchAlertas]);

  // ─── Socket.IO: notificaciones en tiempo real ───
  // Importación dinámica: socket.io-client solo se descarga si se usa este hook
  // getSocket() ahora es async (dynamic import interno), por eso se encadena .then()
  useEffect(() => {
    let socket;
    let cancelled = false;
    let cleanupSocket;

    const handleNuevaAlerta = () => {
      fetchAlertas(1, true);
    };

    const handleAlertaResuelta = () => {
      fetchAlertas(1, true);
    };

    const handleConnect = () => {
      fetchAlertas(1, true);
    };

    import("../services/socketService")
      .then((mod) => {
        if (cancelled) return;
        return mod.getSocket();
      })
      .then((s) => {
        if (cancelled || !s) return;
        socket = s;

        socket.on("connect", handleConnect);
        socket.on("nueva-alerta", handleNuevaAlerta);
        socket.on("alerta-resuelta", handleAlertaResuelta);

        cleanupSocket = () => {
          socket.off("connect", handleConnect);
          socket.off("nueva-alerta");
          socket.off("alerta-resuelta");
        };
      })
      .catch(() => {
        if (!cancelled) {
          console.warn("[useAlertas] Socket.IO no disponible — solo polling");
        }
      });

    return () => {
      cancelled = true;
      if (cleanupSocket) cleanupSocket();
    };
  }, [fetchAlertas]);

  const hayMas = meta ? meta.pagina_actual < meta.paginas_totales : false;
  const totalAlertas = meta?.total ?? 0;

  return {
    alertas,
    meta,
    loading,
    cargandoMas,
    error,
    hayMas,
    totalAlertas,
    cargarMas,
    refrescar,
  };
};

export default useAlertas;
