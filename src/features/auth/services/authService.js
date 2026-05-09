import axiosInstance from "../../../api/axiosInstance"
import { AUTH_ENDPOINTS } from "../../../api/endpoints/authEndpoints"

export const loginUser = async (credenciales) => {
  const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, credenciales);
  return response;
}

export const logoutUser = async () => {
  const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
  return response;
}