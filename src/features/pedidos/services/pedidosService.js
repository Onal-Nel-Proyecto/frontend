// ================================================================
// pedidosService — API para el módulo de pedidos
// ================================================================

import axiosInstance from "../../../api/axiosInstance";

const BASE = "/pedidos";

/** Obtener listado paginado de pedidos */
export const getPedidos = async (pag = 1, filtros = {}) => {
  const params = new URLSearchParams({ pag });
  if (filtros.estado) params.append("estado", filtros.estado);
  if (filtros.cliente) params.append("cliente", filtros.cliente);
  if (filtros.fecha_desde) params.append("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.append("fecha_hasta", filtros.fecha_hasta);
  if (filtros.tipo_pedido) params.append("tipo_pedido", filtros.tipo_pedido);
  if (filtros.estado_pago) params.append("estado_pago", filtros.estado_pago);
  if (filtros.fecha_entrega_desde) params.append("fecha_entrega_desde", filtros.fecha_entrega_desde);
  if (filtros.fecha_entrega_hasta) params.append("fecha_entrega_hasta", filtros.fecha_entrega_hasta);
  console.log(`${BASE}?${params}`)
  const res = await axiosInstance.get(`${BASE}?${params}`);
  return res.data;
};

/** Obtener detalle de un pedido por ID */
export const getPedidoById = async (id) => {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return res.data;
};

/** Crear un nuevo pedido */
export const createPedido = async (data) => {
  const res = await axiosInstance.post(BASE, data);
  return res.data;
};

/** Actualizar un pedido */
export const updatePedido = async (id, data) => {
  const res = await axiosInstance.put(`${BASE}/${id}`, data);
  return res.data;
};

/** Crear un detalle de pedido */
export const createDetalle = async (pedidoId, data) => {
  const res = await axiosInstance.post(`${BASE}/${pedidoId}/detalles`, data);
  return res.data;
};

/** Actualizar un detalle de pedido */
export const updateDetalle = async (pedidoId, detalleId, data) => {
  const res = await axiosInstance.patch(`${BASE}/${pedidoId}/detalles/${detalleId}`, data);
  return res.data;
};

/** Crear producción en un detalle */
export const createProduccion = async (pedidoId, detalleId, data) => {
  const res = await axiosInstance.post(`${BASE}/${pedidoId}/detalles/${detalleId}/produccion`, data);
  return res.data;
};

/** Actualizar producción */
export const updateProduccion = async (pedidoId, detalleId, produccionId, data) => {
  const res = await axiosInstance.patch(`${BASE}/${pedidoId}/detalles/${detalleId}/produccion/${produccionId}`, data);
  console.log(data)
  return res.data;
};

/** Cancelar un pedido */
export const cancelPedido = async (pedidoId, data) => {
  const res = await axiosInstance.patch(`${BASE}/${pedidoId}/cancelar`, data);
  return res.data;
};

/** Eliminar un detalle de pedido */
export const deleteDetalle = async (pedidoId, detalleId) => {
  const res = await axiosInstance.delete(`${BASE}/${pedidoId}/detalles/${detalleId}`);
  return res.data;
};
