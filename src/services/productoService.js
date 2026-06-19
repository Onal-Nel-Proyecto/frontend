// ================================================================
// productoService — API para el módulo de Productos
// ================================================================

import axiosInstance from "../api/axiosInstance";

const BASE = "/productos";

/** Obtener listado de productos con filtros opcionales */
export const getProductos = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.nombre) params.append("nombre", filtros.nombre);
  if (filtros.estado) params.append("estado", filtros.estado);
  if (filtros.pag) params.append("pag", filtros.pag);
  const queryString = params.toString();
  const res = await axiosInstance.get(`${BASE}${queryString ? `?${queryString}` : ""}`);
  return res.data;
};
