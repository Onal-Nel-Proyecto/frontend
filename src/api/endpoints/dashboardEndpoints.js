import axiosInstance from "../axiosInstance";

const DASHBOARD_ENDPOINTS = {
  RESUMEN: "/dashboard/resumen",
};

export const getDashboardResumen = async () => {
  const response = await axiosInstance.get(DASHBOARD_ENDPOINTS.RESUMEN);
  return response.data;
};
