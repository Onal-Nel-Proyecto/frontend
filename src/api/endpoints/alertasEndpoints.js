// ================================================================
// alertasEndpoints — Endpoints para el sistema de notificaciones
// ================================================================

import axiosInstance from "../axiosInstance";

const ALERTAS_ENDPOINT = "/alertas";

/**
 * Obtener lista paginada de alertas/notificaciones
 * @param {Object} options
 * @param {number} options.pagina  - Número de página (default 1)
 * @param {number} options.limite  - Items por página (default 15)
 * @param {string} options.estado  - Filtrar por estado (ACTIVO, etc.)
 * @param {string} options.tipo    - Filtrar por tipo (INFO, WARNING, ERROR)
 * @param {string} options.categoria - Filtrar por categoría
 * @returns {Promise<{meta: Object, data: Array}>}
 */
export const getAlertas = async ({
  pagina = 1,
  limite = 15,
  estado,
  tipo,
  categoria,
} = {}) => {
  const params = { pagina, limite };

  if (estado) params.estado = estado;
  if (tipo) params.tipo = tipo;
  if (categoria) params.categoria = categoria;

  const response = await axiosInstance.get(ALERTAS_ENDPOINT, { params });
  return response.data;
};
