import axiosInstance from "../../../api/axiosInstance";
import { AUTH_ENDPOINTS } from "../../../api/endpoints/authEndpoints";

export const verifySession = async () => {

  const response = await axiosInstance.get(AUTH_ENDPOINTS.PROFILE);

  return response.data;
};