// ================================================================
// pagosService — API unificada de pagos
// Sirve tanto para pedidos como para ventas.
// El endpoint /pagos acepta pedido_id o venta_id según el caso.
//   GET    /pagos?pedido_id=X | /pagos?venta_id=Y
//   POST   /pagos
//   PATCH  /pagos/:id/rechazar
// ================================================================

import axiosInstance from "../api/axiosInstance";

const BASE = "/pagos";

// ═══════════════════════════════════════════════════════════
// GET /pagos
// ═══════════════════════════════════════════════════════════

/**
 * Obtener pagos de un pedido o venta.
 * Devuelve { pagos, resumen, meta }.
 * @param {string|null} pedidoId
 * @param {string|null} ventaId
 */
export const getPagos = async ({ pedidoId = null, ventaId = null } = {}) => {
  const params = {};
  if (ventaId) params.venta_id = ventaId;
  else if (pedidoId) params.pedido_id = pedidoId;

  const res = await axiosInstance.get(BASE, { params });
  return {
    pagos: res.data?.data || [],
    resumen: res.data?.resumen || null,
    meta: res.data?.meta || null,
  };
};

/** @deprecated Usar getPagos({ pedidoId, ventaId }) */
export const getPagosByPedido = async (pedidoId, ventaId = null) =>
  getPagos({ pedidoId, ventaId });

/** @deprecated Usar getPagos({ ventaId }) */
export const getPagosByVenta = async (ventaId) =>
  getPagos({ ventaId });

// ═══════════════════════════════════════════════════════════
// POST /pagos
// ═══════════════════════════════════════════════════════════

/**
 * Registrar un pago (pedido o venta).
 * El payload lleva pedido_id o venta_id según corresponda.
 *
 * @param {object} opts
 * @param {string}  [opts.pedidoId]
 * @param {string}  [opts.ventaId]
 * @param {number}  opts.monto
 * @param {string}  opts.metodo      - Método de pago (efectivo, transferencia, tarjeta)
 */
export const createPago = async ({ pedidoId = null, ventaId = null, monto, metodo }) => {
  const payload = {
    monto: Number(monto),
    metodo_pago: metodo,
  };
  if (ventaId) payload.venta_id = ventaId;
  else if (pedidoId) payload.pedido_id = pedidoId;

  const res = await axiosInstance.post(BASE, payload);
  return res.data;
};

/** @deprecated Usar createPago({ pedidoId, ventaId, monto, metodo }) */
export const createPagoPedido = async (pedidoId, data) =>
  createPago({
    pedidoId,
    ventaId: data.venta_id || null,
    monto: data.monto,
    metodo: data.metodo,
  });

/** @deprecated Usar createPago({ ventaId, monto, metodo }) */
export const createPagoVenta = async (ventaId, data) =>
  createPago({
    ventaId,
    monto: data.monto,
    metodo: data.metodo,
  });

// ═══════════════════════════════════════════════════════════
// PATCH /pagos/:id/rechazar — Anular un pago
// ═══════════════════════════════════════════════════════════

/**
 * Rechazar / anular un pago.
 * Usa PATCH /pagos/:id/rechazar (no DELETE).
 * @param {string} pagoId
 */
export const rechazarPago = async (pagoId) => {
  const res = await axiosInstance.patch(`${BASE}/${pagoId}/rechazar`);
  return res.data;
};

/** @deprecated Usar rechazarPago */
export const deletePagoPedido = rechazarPago;

/** @deprecated Usar rechazarPago */
export const deletePagoVenta = rechazarPago;
