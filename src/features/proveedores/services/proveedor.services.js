import axiosInstance from '../../../api/axiosInstance';

export const getProveedores = async (params = {}) => {
  const response = await axiosInstance.get('/proveedores', { params });
  // backend returns { meta, data } — normalize to array when possible
  return response.data?.data ?? response.data;
};

export const createProveedor = async (data) => {
  const response = await axiosInstance.post('/proveedores', data);
  return response.data;
};

export const updateProveedor = async (id, data) => {
  const response = await axiosInstance.put(`/proveedores/${id}`, data);
  return response.data;
};

export const deleteProveedor = async (id) => {
  const response = await axiosInstance.delete(`/proveedores/${id}`);
  return response.data;
};
