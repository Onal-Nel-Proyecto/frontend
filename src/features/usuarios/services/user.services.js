
import axiosInstance from '../../../api/axiosInstance';




// ─── Obtener usuario ────────────────────────────

export const getUsuarios = async () => {

  const response =
    await axiosInstance.get('/usuarios');

  return response.data;
};

// ─── Crear usuario ──────────────────────────────

export const createUsuario = async (data) => {

  const response =
    await axiosInstance.post(
      '/usuarios',
      data
    );

  return response.data;
};
// ─── Actualizar usuario ─────────────────────────

export const updateUsuario = async (id, data) => {
  const response = await axiosInstance.put(`/usuarios/${id}`, data);
  return response.data;
};


// ─── Cambiar estado ─────────────────────────────

export const changeEstadoUsuario = async (id, estado) => {
  const response = await axiosInstance.patch(
    `/usuarios/${id}/estado`,
    { estado }
  );
  return response.data;
};


// Eliminar usuario

export const deleteUsuario = async (id) => {

  const response =
    await axiosInstance.delete(
      `/usuarios/${id}`
    );

  return response.data;
};