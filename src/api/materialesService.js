import axiosInstance from "./axiosInstance";

// GET /materiales — lista paginada con filtros
export const getMateriales = async ({ pagina = 1, limite = 15, nombre = "", estado = "", tipoMaterial = "" } = {}) => {
  const params = { pagina, limite };
  if (nombre.trim()) params.nombre = nombre.trim();
  if (estado) params.estado = estado;
  if (tipoMaterial) params.tipoMaterial = tipoMaterial;
  const res = await axiosInstance.get("/materiales", { params });
  return res.data;
};

// GET /materiales/:id
export const getMaterialById = async (id) => {
  const res = await axiosInstance.get(`/materiales/${id}`);
  return res.data;
};

// POST /materiales
export const createMaterial = async (data) => {
  const res = await axiosInstance.post("/materiales", data);
  return res.data;
};

// PUT /materiales/:id
export const updateMaterial = async (id, data) => {
  const res = await axiosInstance.put(`/materiales/${id}`, data);
  return res.data;
};

// PATCH /materiales/:id/estado
export const changeMaterialEstado = async (id, estado) => {
  const res = await axiosInstance.patch(`/materiales/${id}/estado`, { estado });
  return res.data;
};
