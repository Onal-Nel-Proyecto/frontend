import axiosInstance from "./axiosInstance";
import { CLIENTES_ENDPOINTS } from "./endpoints/clientesEndpoints";

// ──────────────────────────────────────────────
//  Utilidad: normalizar la respuesta del backend
// ──────────────────────────────────────────────

/**
 * El backend puede devolver:
 *   { data: [...], meta: { total, ... } }  → paginado
 *   o un array plano                        → sin paginar
 *   o { status, msg }                       → respuesta de mutación
 *
 * Esta función siempre extrae el array de datos.
 */
const extraerData = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (respuesta?.data && Array.isArray(respuesta.data)) return respuesta.data;
  if (respuesta?.data && !Array.isArray(respuesta.data)) return [respuesta.data];
  return [];
};

// ──────────────────────────────────────────────
//  Servicios
// ──────────────────────────────────────────────

/** GET /clientes — obtener lista paginada */
export const getClientes = async (pagina = 1, limite = 15) => {
  const response = await axiosInstance.get(CLIENTES_ENDPOINTS.GET_ALL, {
    params: { pagina, limite },
  });
  return response.data; // { meta: {...}, data: [...] }
};

/** GET /clientes/:id — obtener un cliente por ID */
export const getClienteById = async (id) => {
  const response = await axiosInstance.get(CLIENTES_ENDPOINTS.GET_BY_ID(id));
  return response.data; // objeto cliente
};

/** POST /clientes — crear un nuevo cliente */
export const createCliente = async (clienteData) => {
  const response = await axiosInstance.post(CLIENTES_ENDPOINTS.CREATE, clienteData);
  return response.data; // objeto cliente creado
};

/** PUT /clientes/:id — actualizar un cliente */
export const updateCliente = async (id, clienteData) => {
  const response = await axiosInstance.put(CLIENTES_ENDPOINTS.UPDATE(id), clienteData);
  return response.data; // { status, msg }
};

/** PATCH /clientes/:id/estado — cambiar estado (activar / eliminar lógico) */
export const changeStatus = async (id, estado) => {
  const response = await axiosInstance.patch(CLIENTES_ENDPOINTS.CHANGE_STATUS(id), {
    estado,
  });
  return response.data; // { status, msg }
};
