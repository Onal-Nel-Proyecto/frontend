// ================================================================
// productosService — API de productos para el módulo de ventas
// GET /productos — lista paginada con filtro por nombre
// ================================================================

import axiosInstance from "../../../api/axiosInstance";

/**
 * Obtener lista paginada de productos activos de inventario
 * @param {Object} opts
 * @param {number} opts.pagina  - Página actual (default 1)
 * @param {number} opts.limite  - Items por página (default 50)
 * @param {string} opts.nombre  - Filtro LIKE sobre nombre
 * @returns {Promise<{status, data, meta}>}
 */
export const getProductos = async ({ pagina = 1, limite = 50, nombre = "" } = {}) => {
  const params = { pagina, limite, estado: 1 };
  if (nombre.trim()) params.nombre = nombre.trim();

  const response = await axiosInstance.get("/productos", { params });
  return response.data;
};

/**
 * Buscar productos por nombre (wrapper para uso en formularios)
 * @param {string} query - Texto a buscar
 * @returns {Promise<Array>} Lista plana de productos
 */
export const searchProductos = async (query) => {
  if (!query.trim()) return [];

  const resp = await getProductos({ nombre: query, limite: 20 });
  const items = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
  return items;
};
