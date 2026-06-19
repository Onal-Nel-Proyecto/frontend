import axiosInstance from "./axiosInstance";

// GET /productos — lista paginada con filtros
export const getProductos = async ({ pagina = 1, limite = 15, nombre = "", estado = "", categoria = "", tipoProducto = "" } = {}) => {
  const params = { pagina, limite };
  if (nombre.trim()) params.nombre = nombre.trim();
  if (estado) params.estado = estado;
  if (categoria) params.categoria = categoria;
  if (tipoProducto) params.tipoProducto = tipoProducto;
  const res = await axiosInstance.get("/productos", { params });
  return res.data;
};

// GET /productos/:id
export const getProductoById = async (id) => {
  const res = await axiosInstance.get(`/productos/${id}`);
  return res.data;
};

// POST /productos
export const createProducto = async (data) => {
  const res = await axiosInstance.post("/productos", data);
  return res.data;
};

// PUT /productos/:id
export const updateProducto = async (id, data) => {
  const res = await axiosInstance.put(`/productos/${id}`, data);
  return res.data;
};

// PATCH /productos/:id/estado
export const changeProductoEstado = async (id, estado) => {
  const res = await axiosInstance.patch(`/productos/${id}/estado`, { estado });
  return res.data;
};
