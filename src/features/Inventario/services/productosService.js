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
export const getProductos = async ({ pagina = 1, limite = 50, nombre = "", tipo_origen } = {}) => {
  const params = { pagina, limite, estado: 1 };
  if (nombre.trim()) params.nombre = nombre.trim();
  if (tipo_origen) params.tipo_origen = tipo_origen;

  const response = await axiosInstance.get("/productos", { params });
  return response.data;
};

/**
 * Buscar productos por nombre (wrapper para uso en formularios)
 * @param {string} query - Texto a buscar
 * @returns {Promise<Array>} Lista plana de productos
 */
export const searchProductos = async (query, { tipo_origen } = {}) => {
  if (!query.trim()) return [];

  const resp = await getProductos({ nombre: query, limite: 20, tipo_origen });
  const items = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
  return items;
};
