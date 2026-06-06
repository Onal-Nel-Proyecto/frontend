import axiosInstance from "../axiosInstance";

const DASHBOARD_ENDPOINTS = {
  RESUMEN: "/dashboard/resumen",
  PEDIDOS: "/dashboard/pedidos",
};

export const getDashboardResumen = async () => {
  const response = await axiosInstance.get(DASHBOARD_ENDPOINTS.RESUMEN);
  return response.data;
};

export const getDashboardPedidos = async () => {
  const response = await axiosInstance.get(DASHBOARD_ENDPOINTS.PEDIDOS);
  return response.data;
};
