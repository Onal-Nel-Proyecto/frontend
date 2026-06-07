export const VENTAS_ENDPOINTS = {
  /** GET /ventas — lista paginada */
  GET_ALL: "/ventas",

  /** GET /ventas/:id — obtener una venta con detalles */
  GET_BY_ID: (id) => `/ventas/${id}`,

  /** POST /ventas — crear nueva venta */
  CREATE: "/ventas",

  /** PATCH /ventas/:id/estado — cambiar estado */
  CHANGE_STATUS: (id) => `/ventas/${id}/estado`,

  /** GET /ventas/reportes/mensual?mes=&anio= */
  REPORTE_MENSUAL: "/ventas/reportes/mensual",

  /** GET /ventas/reportes/periodo?fechaInicio=&fechaFin= */
  REPORTE_PERIODO: "/ventas/reportes/periodo",

  /** GET /ventas/reportes/mensual/pdf?mes=&anio= */
  REPORTE_MENSUAL_PDF: "/ventas/reportes/mensual/pdf",

  /** GET /ventas/reportes/mensual/excel?mes=&anio= */
  REPORTE_MENSUAL_EXCEL: "/ventas/reportes/mensual/excel",

  /** GET /ventas/reportes/periodo/pdf?fechaInicio=&fechaFin= */
  REPORTE_PERIODO_PDF: "/ventas/reportes/periodo/pdf",

  /** GET /ventas/reportes/periodo/excel?fechaInicio=&fechaFin= */
  REPORTE_PERIODO_EXCEL: "/ventas/reportes/periodo/excel",
};
