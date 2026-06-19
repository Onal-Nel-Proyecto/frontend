// ================================================================
// medidasService — API para el módulo de Medidas
// ================================================================

import axiosInstance from "../api/axiosInstance";

const BASE = "/medidas";

/** Obtener listado paginado de medidas */
export const getMedidas = async (pag = 1, filtros = {}) => {
  const params = new URLSearchParams({ pag });
  if (filtros.nombre) params.append("nombre", filtros.nombre);
  if (filtros.estado) params.append("estado", filtros.estado);
  const res = await axiosInstance.get(`${BASE}?${params}`);
  return res.data;
};

/** Obtener una medida por ID */
export const getMedidaById = async (id) => {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return res.data;
};

/** Crear una nueva medida */
export const createMedida = async (data) => {
  const res = await axiosInstance.post(BASE, data);
  return res.data;
};

/** Actualizar una medida */
export const updateMedida = async (id, data) => {
  const res = await axiosInstance.put(`${BASE}/${id}`, data);
  return res.data;
};

/** Cambiar estado de una medida (ACTIVO / INACTIVO) */
export const changeMedidaStatus = async (id, data) => {
  const res = await axiosInstance.patch(`${BASE}/${id}/estado`, data);
  return res.data;
};

/** Eliminar una medida */
export const deleteMedida = async (id) => {
  const res = await axiosInstance.delete(`${BASE}/${id}`);
  return res.data;
};
