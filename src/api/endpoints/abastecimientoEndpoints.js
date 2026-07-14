export const ABASTECIMIENTO_ENDPOINTS = {
  /** GET — listar abastecimientos paginados */
  BASE: "/abastecimientos",

  /** GET — listar abastecimientos */
  GET_ALL: "/abastecimientos",

  /** GET — obtener un abastecimiento por ID */
  GET_BY_ID: (id) => `/abastecimientos/${id}`,

  /** POST — crear un nuevo abastecimiento con sus detalles */
  CREATE: "/abastecimientos",

  /** PATCH — completar abastecimiento (actualiza stock) */
  COMPLETAR: (id) => `/abastecimientos/${id}/completar`,

  /** PATCH — cancelar abastecimiento */
  CANCELAR: (id) => `/abastecimientos/${id}/cancelar`,

  /** GET — listar proveedores (para selects) */
  PROVEEDORES: "/abastecimientos/proveedores",
};
