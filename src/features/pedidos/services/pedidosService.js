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

  const res = await axiosInstance.get(`${BASE}?${params}`);
  return res.data;
};

/** Obtener detalle de un pedido por ID */
export const getPedidoById = async (id) => {
  const res = await axiosInstance.get(`${BASE}/${id}`);
  return res.data;
};
