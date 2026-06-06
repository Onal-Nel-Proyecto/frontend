import axiosInstance from "./axiosInstance";
import { VENTAS_ENDPOINTS } from "./endpoints/ventasEndpoints";

/**
 * Normaliza la respuesta del backend extrayendo la propiedad `data`
 * si existe (patrón común: { data: { ... }, message, status }).
 */
const normalizarRespuesta = (raw) => {
  if (!raw) return raw;
  // Si raw.data es un objeto no-array con claves de reporte, devolver raw.data
  if (
    raw.data &&
    typeof raw.data === 'object' &&
    !Array.isArray(raw.data) &&
    (raw.data.resumen || raw.data.topProductos || raw.data.ventasPorDia)
  ) {
    return raw.data;
  }
  return raw;
};

/**
 * GET /ventas/reportes/mensual
 * Obtiene reporte mensual de ventas.
 * @param {number} mes  - Número del mes (1-12)
 * @param {number} anio - Año (ej. 2026)
 * @returns {Promise<{resumen, topProductos, ventasPorDia}>}
 */
export const getReporteVentasMensual = async (mes, anio) => {
  const response = await axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_MENSUAL, {
    params: { mes, anio },
  });
  return normalizarRespuesta(response.data);
};

/**
 * GET /ventas/reportes/periodo
 * Obtiene reporte de ventas por rango de fechas.
 * @param {string} fechaInicio - Fecha inicial (YYYY-MM-DD)
 * @param {string} fechaFin    - Fecha final (YYYY-MM-DD)
 * @returns {Promise<{resumen, topProductos, ventasPorDia}>}
 */
export const getReporteVentasPeriodo = async (fechaInicio, fechaFin) => {
  const response = await axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_PERIODO, {
    params: { fechaInicio, fechaFin },
  });
  return normalizarRespuesta(response.data);
};

// ═══════════════════════════════════════════════════════════════
// EXPORTACIÓN — PDF
// ═══════════════════════════════════════════════════════════════

/**
 * GET /ventas/reportes/mensual/pdf
 * Descarga el reporte mensual en PDF.
 * @param {number} mes  - Número del mes (1-12)
 * @param {number} anio - Año
 * @returns {Promise<axios.AxiosResponse>} response con blob en .data
 */
export const exportReporteMensualPDF = async (mes, anio) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_MENSUAL_PDF, {
    params: { mes, anio },
    responseType: 'blob',
  });
};

/**
 * GET /ventas/reportes/periodo/pdf
 * Descarga el reporte por periodo en PDF.
 * @param {string} fechaInicio - Fecha inicial (YYYY-MM-DD)
 * @param {string} fechaFin    - Fecha final (YYYY-MM-DD)
 * @returns {Promise<axios.AxiosResponse>} response con blob en .data
 */
export const exportReportePeriodoPDF = async (fechaInicio, fechaFin) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_PERIODO_PDF, {
    params: { fechaInicio, fechaFin },
    responseType: 'blob',
  });
};

// ═══════════════════════════════════════════════════════════════
// EXPORTACIÓN — EXCEL
// ═══════════════════════════════════════════════════════════════

/**
 * GET /ventas/reportes/mensual/excel
 * Descarga el reporte mensual en Excel.
 * @param {number} mes  - Número del mes (1-12)
 * @param {number} anio - Año
 * @returns {Promise<axios.AxiosResponse>} response con blob en .data
 */
export const exportReporteMensualExcel = async (mes, anio) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_MENSUAL_EXCEL, {
    params: { mes, anio },
    responseType: 'blob',
  });
};

/**
 * GET /ventas/reportes/periodo/excel
 * Descarga el reporte por periodo en Excel.
 * @param {string} fechaInicio - Fecha inicial (YYYY-MM-DD)
 * @param {string} fechaFin    - Fecha final (YYYY-MM-DD)
 * @returns {Promise<axios.AxiosResponse>} response con blob en .data
 */
export const exportReportePeriodoExcel = async (fechaInicio, fechaFin) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_PERIODO_EXCEL, {
    params: { fechaInicio, fechaFin },
    responseType: 'blob',
  });
};
