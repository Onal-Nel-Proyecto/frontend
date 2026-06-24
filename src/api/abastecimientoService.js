import axiosInstance from "./axiosInstance";
import { ABASTECIMIENTO_ENDPOINTS } from "./endpoints/abastecimientoEndpoints";

// ── GET /abastecimientos — lista paginada ──
export const getAbastecimientos = async (pagina = 1, limite = 15) => {
  const response = await axiosInstance.get(ABASTECIMIENTO_ENDPOINTS.GET_ALL, {
    params: { pagina, limite },
  });
  return response.data; // { meta: {...}, data: [...] }
};

// ── GET /abastecimientos/:id — obtener uno con detalles ──
export const getAbastecimientoById = async (id) => {
  const response = await axiosInstance.get(ABASTECIMIENTO_ENDPOINTS.GET_BY_ID(id));
  return response.data;
};

// ── POST /abastecimientos — crear nuevo ──
export const createAbastecimiento = async (data) => {
  const response = await axiosInstance.post(ABASTECIMIENTO_ENDPOINTS.CREATE, data);
  return response.data;
};

// ── PATCH /abastecimientos/:id/completar ──
export const completarAbastecimiento = async (id) => {
  const response = await axiosInstance.patch(ABASTECIMIENTO_ENDPOINTS.COMPLETAR(id));
  return response.data;
};

// ── PATCH /abastecimientos/:id/cancelar ──
export const cancelarAbastecimiento = async (id) => {
  const response = await axiosInstance.patch(ABASTECIMIENTO_ENDPOINTS.CANCELAR(id));
  return response.data;
};

// ── GET proveedores — listar proveedores ──
// Prueba primero /abastecimientos/proveedores, y si falla usa /proveedores (legacy)
export const getProveedores = async () => {
  try {
    const response = await axiosInstance.get(ABASTECIMIENTO_ENDPOINTS.PROVEEDORES);
    return response.data;
  } catch {
    const response = await axiosInstance.get("/proveedores");
    return response.data;
  }
};
