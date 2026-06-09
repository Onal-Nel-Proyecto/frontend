// ================================================================
// pagosService — API para pagos de pedidos y ventas
// Conecta al backend real usando las rutas:
//   GET  /pagos?pedido_id=X  o  /pagos?venta_id=Y
//   POST /pagos
//   DELETE /pagos/:id
// ================================================================

import axiosInstance from "../../../api/axiosInstance";

const BASE = "/pagos";

/** Obtener pagos de un pedido (usa pedido_id o venta_id si existe) */
export const getPagosByPedido = async (pedidoId, ventaId = null) => {
  const params = {};
  if (ventaId) {
    params.venta_id = ventaId;
  } else {
    params.pedido_id = pedidoId;
  }
  const res = await axiosInstance.get(BASE, { params });
  return res.data?.data || res.data || [];
};

/** Registrar un pago en un pedido */
export const createPagoPedido = async (pedidoId, data) => {
  const payload = {
    monto: Number(data.monto),
    metodo: data.metodo,
  };
  // Si el pedido tiene venta_id, usar ese; si no, usar pedido_id
  if (data.venta_id) {
    payload.venta_id = data.venta_id;
  } else {
    payload.pedido_id = pedidoId;
  }
  const res = await axiosInstance.post(BASE, payload);
  return res.data;
};

/** Eliminar un pago de pedido */
export const deletePagoPedido = async (pagoId) => {
  const res = await axiosInstance.delete(`${BASE}/${pagoId}`);
  return res.data;
};

/** Obtener todos los pagos de una venta */
export const getPagosByVenta = async (ventaId) => {
  const res = await axiosInstance.get(BASE, { params: { venta_id: ventaId } });
  return res.data?.data || res.data || [];
};

/** Registrar un pago en una venta */
export const createPagoVenta = async (ventaId, data) => {
  const payload = {
    venta_id: ventaId,
    monto: Number(data.monto),
    metodo: data.metodo,
  };
  const res = await axiosInstance.post(BASE, payload);
  return res.data;
};

/** Eliminar un pago de venta */
export const deletePagoVenta = async (pagoId) => {
  const res = await axiosInstance.delete(`${BASE}/${pagoId}`);
  return res.data;
};
