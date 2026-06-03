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
