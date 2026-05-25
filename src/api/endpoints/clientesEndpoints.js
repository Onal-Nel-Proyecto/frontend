export const CLIENTES_ENDPOINTS = {
  /** GET — listar clientes paginados (?pagina=&limite=) */
  BASE: "/clientes",

  /** GET — listar clientes */
  GET_ALL: "/clientes",

  /** GET — obtener un cliente por ID */
  GET_BY_ID: (id) => `/clientes/${id}`,

  /** POST — crear un nuevo cliente */
  CREATE: "/clientes",

  /** PUT — actualizar un cliente existente */
  UPDATE: (id) => `/clientes/${id}`,

  /** PATCH — cambiar estado (activar / eliminar lógico) */
  CHANGE_STATUS: (id) => `/clientes/${id}/estado`,
};
