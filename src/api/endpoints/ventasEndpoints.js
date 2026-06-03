export const VENTAS_ENDPOINTS = {
  /** GET — listar ventas paginadas */
  BASE: "/ventas",

  /** GET — listar ventas */
  GET_ALL: "/ventas",

  /** GET — obtener una venta por ID */
  GET_BY_ID: (id) => `/ventas/${id}`,

  /** POST — crear una nueva venta */
  CREATE: "/ventas",

  /** PATCH — cambiar estado de una venta */
  CHANGE_STATUS: (id) => `/ventas/${id}/estado`,

  /** GET — obtener pagos de una venta */
  PAGOS_BY_VENTA: (ventaId) => `/ventas/${ventaId}/pagos`,

  /** POST — registrar pago en una venta */
  CREATE_PAGO: (ventaId) => `/ventas/${ventaId}/pagos`,
};
