// ================================================================
// pagosService — API para pagos de pedidos y ventas
// Almacenamiento local (localStorage) para persistencia inicial.
// Fácil de migrar a backend real cambiando las implementaciones.
// ================================================================

// Generador de IDs único (sin dependencia externa)
const genId = () => `pago_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const STORAGE_PEDIDOS = 'ona_pagos_pedidos';
const STORAGE_VENTAS = 'ona_pagos_ventas';

// ── Helpers ──────────────────────────────────────────────

const getPagos = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const savePagos = (storageKey, pagos) => {
  localStorage.setItem(storageKey, JSON.stringify(pagos));
};

// ── Pagos de Pedidos ─────────────────────────────────────

/** Obtener todos los pagos de un pedido específico */
export const getPagosByPedido = async (pedidoId) => {
  const pagos = getPagos(STORAGE_PEDIDOS);
  return pagos.filter((p) => String(p.pedido_id) === String(pedidoId));
};

/** Registrar un pago en un pedido */
export const createPagoPedido = async (pedidoId, data) => {
  const pagos = getPagos(STORAGE_PEDIDOS);
  const nuevoPago = {
    pago_id: genId(),
    pedido_id: String(pedidoId),
    monto: Number(data.monto),
    metodo: data.metodo,
    metodo_otro: data.metodo_otro || '',
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    notas: data.notas || '',
    usuario: data.usuario || 'Admin',
    estado: 'completado',
    created_at: new Date().toISOString(),
  };
  pagos.push(nuevoPago);
  savePagos(STORAGE_PEDIDOS, pagos);
  return nuevoPago;
};

/** Eliminar un pago de pedido */
export const deletePagoPedido = async (pagoId) => {
  let pagos = getPagos(STORAGE_PEDIDOS);
  pagos = pagos.filter((p) => p.pago_id !== pagoId);
  savePagos(STORAGE_PEDIDOS, pagos);
  return { status: true, msg: 'Pago eliminado' };
};

// ── Pagos de Ventas ───────────────────────────────────────

/** Obtener todos los pagos de una venta específica */
export const getPagosByVenta = async (ventaId) => {
  const pagos = getPagos(STORAGE_VENTAS);
  return pagos.filter((p) => String(p.venta_id) === String(ventaId));
};

/** Registrar un pago en una venta */
export const createPagoVenta = async (ventaId, data) => {
  const pagos = getPagos(STORAGE_VENTAS);
  const nuevoPago = {
    pago_id: genId(),
    venta_id: String(ventaId),
    monto: Number(data.monto),
    metodo: data.metodo,
    metodo_otro: data.metodo_otro || '',
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    notas: data.notas || '',
    usuario: data.usuario || 'Admin',
    estado: 'completado',
    created_at: new Date().toISOString(),
  };
  pagos.push(nuevoPago);
  savePagos(STORAGE_VENTAS, pagos);
  return nuevoPago;
};

/** Eliminar un pago de venta */
export const deletePagoVenta = async (pagoId) => {
  let pagos = getPagos(STORAGE_VENTAS);
  pagos = pagos.filter((p) => p.pago_id !== pagoId);
  savePagos(STORAGE_VENTAS, pagos);
  return { status: true, msg: 'Pago eliminado' };
};
