// ================================================================
// categoriaService — API para el módulo de Categorías
// ================================================================

import axiosInstance from "../api/axiosInstance";

const BASE = "/categorias";

/** Obtener listado paginado de categorías */
export const getCategorias = async (pag = 1, filtros = {}) => {
  const params = new URLSearchParams({ pag });
  if (filtros.nombre) params.append("nombre", filtros.nombre);
  if (filtros.estado) params.append("estado", filtros.estado);
  const res = await axiosInstance.get(`${BASE}?${params}`);
  return res.data;
};

/** Obtener una categoría por ID */
export const getCategoriaById = async (id) => {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return res.data;
};

/** Crear una nueva categoría */
export const createCategoria = async (data) => {
  const res = await axiosInstance.post(BASE, data);
  return res.data;
};

/** Actualizar una categoría */
export const updateCategoria = async (id, data) => {
  const res = await axiosInstance.put(`${BASE}/${id}`, data);
  return res.data;
};

/** Cambiar estado de una categoría (ACTIVO / INACTIVO) */
export const changeCategoriaStatus = async (id, data) => {
  const res = await axiosInstance.patch(`${BASE}/${id}/estado`, data);
  return res.data;
};

/** Eliminar una categoría */
export const deleteCategoria = async (id) => {
  const res = await axiosInstance.delete(`${BASE}/${id}`);
  return res.data;
};
