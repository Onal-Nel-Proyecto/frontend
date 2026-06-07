import axiosInstance from "./axiosInstance";
import { VENTAS_ENDPOINTS } from "./endpoints/ventasEndpoints";

// ── GET /ventas — lista paginada ──
export const getVentas = async (pagina = 1, limite = 15) => {
  const response = await axiosInstance.get(VENTAS_ENDPOINTS.GET_ALL, {
    params: { pagina, limite },
  });
  return response.data;
};

// ── GET /ventas/:id — obtener una venta con detalles ──
export const getVentaById = async (id) => {
  const response = await axiosInstance.get(VENTAS_ENDPOINTS.GET_BY_ID(id));
  return response.data;
};

// ── POST /ventas — crear nueva venta ──
export const createVenta = async (data) => {
  const response = await axiosInstance.post(VENTAS_ENDPOINTS.CREATE, data);
  return response.data;
};

// ── PATCH /ventas/:id/estado — cambiar estado ──
export const changeEstadoVenta = async (id, estado) => {
  const response = await axiosInstance.patch(VENTAS_ENDPOINTS.CHANGE_STATUS(id), { estado });
  return response.data;
};

/**
 * Normaliza la respuesta del backend extrayendo la propiedad `data`
 * si existe (patrón común: { data: { ... }, message, status }).
 */
const normalizarRespuesta = (raw) => {
  if (!raw) return raw;
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

// ── REPORTES ──

export const getReporteVentasMensual = async (mes, anio) => {
  const response = await axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_MENSUAL, {
    params: { mes, anio },
  });
  return normalizarRespuesta(response.data);
};

export const getReporteVentasPeriodo = async (fechaInicio, fechaFin) => {
  const response = await axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_PERIODO, {
    params: { fechaInicio, fechaFin },
  });
  return normalizarRespuesta(response.data);
};

export const exportReporteMensualPDF = async (mes, anio) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_MENSUAL_PDF, {
    params: { mes, anio },
    responseType: 'blob',
  });
};

export const exportReportePeriodoPDF = async (fechaInicio, fechaFin) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_PERIODO_PDF, {
    params: { fechaInicio, fechaFin },
    responseType: 'blob',
  });
};

export const exportReporteMensualExcel = async (mes, anio) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_MENSUAL_EXCEL, {
    params: { mes, anio },
    responseType: 'blob',
  });
};

export const exportReportePeriodoExcel = async (fechaInicio, fechaFin) => {
  return axiosInstance.get(VENTAS_ENDPOINTS.REPORTE_PERIODO_EXCEL, {
    params: { fechaInicio, fechaFin },
    responseType: 'blob',
  });
};
