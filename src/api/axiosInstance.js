import axios from "axios";
import { AUTH_ENDPOINTS } from "./endpoints/authEndpoints";

const axiosInstance = axios.create({

  baseURL: import.meta.env.VITE_API_URL,

  withCredentials: true,

  timeout: 3000, // 3 segundos — si el backend no responde, falla rápido

  headers: {
    "Content-Type": "application/json",
  },
});


// ===============================
// RESPONSE INTERCEPTOR
// ===============================

axiosInstance.interceptors.response.use(

  (response) => response,

  async (error) => {

    // Usuario no autenticado
    if (error.response?.status === 401) {
      // await axiosInstance.post("/auth/refresh"); // Intentar refrescar token
      // if (error.config && !error.config._retry) {
      //   error.config._retry = true;
      //   return axiosInstance(error.config); // Reintentar la petición original
      // }
      
      console.log("Sesión expirada");
      await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT); // Cerrar sesión en backend
      // limpiar usuario local
      localStorage.removeItem("user");
    }

    // Usuario sin permisos
    if (error.response?.status === 403) {

      console.log("Acceso denegado");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;