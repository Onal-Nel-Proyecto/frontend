// ================================================================
// serverDate.js — Obtener la fecha del servidor
// Hace una petición HEAD a un endpoint existente y extrae
// la fecha de la cabecera Date de la respuesta.
// Útil para el input min="…" en formularios, evitando que
// la fecha local del equipo del usuario afecte la validación.
// ================================================================

import axiosInstance from '../api/axiosInstance';

let cachedServerDate = null;
let lastFetch = 0;
const CACHE_TTL = 60_000; // 1 minuto

/**
 * Obtiene la fecha actual del servidor como string YYYY-MM-DD.
 * @returns {Promise<string>}
 */
export const getServerDate = async () => {
  const now = Date.now();

  // Usar cache si es reciente
  if (cachedServerDate && (now - lastFetch) < CACHE_TTL) {
    return cachedServerDate;
  }

  try {
    // HEAD request a un endpoint existente — incluso un 404/401
    // incluye la cabecera Date en la respuesta
    const response = await axiosInstance.head('/alertas', { timeout: 5000 });
    const dateHeader = response.headers?.date;

    if (dateHeader) {
      const serverDate = new Date(dateHeader);
      if (!isNaN(serverDate.getTime())) {
        const y = serverDate.getFullYear();
        const m = String(serverDate.getMonth() + 1).padStart(2, '0');
        const d = String(serverDate.getDate()).padStart(2, '0');
        const result = `${y}-${m}-${d}`;
        cachedServerDate = result;
        lastFetch = now;
        return result;
      }
    }
  } catch (err) {
    // Si falla la petición (red, CORS, etc.), la cabecera Date
    // aún puede estar disponible en la respuesta del error
    const dateHeader = err.response?.headers?.date;
    if (dateHeader) {
      const serverDate = new Date(dateHeader);
      if (!isNaN(serverDate.getTime())) {
        const y = serverDate.getFullYear();
        const m = String(serverDate.getMonth() + 1).padStart(2, '0');
        const d = String(serverDate.getDate()).padStart(2, '0');
        const result = `${y}-${m}-${d}`;
        cachedServerDate = result;
        lastFetch = now;
        return result;
      }
    }
  }

  // Fallback: si todo falla, retornar la fecha local
  const local = new Date();
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().split('T')[0];
};

/**
 * Limpia la caché de la fecha del servidor.
 * Útil si se necesita forzar una nueva consulta.
 */
export const clearServerDateCache = () => {
  cachedServerDate = null;
  lastFetch = 0;
};
