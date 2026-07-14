// ================================================================
// axiosInstance — Instancia central de Axios
// Configura baseURL, credenciales (cookies) e intercepta
// respuestas 401 para refrescar el token automáticamente.
// ================================================================

import axios from "axios";
import { AUTH_ENDPOINTS } from "./endpoints/authEndpoints";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000, // 15 segundos — tiempo razonable para el backend
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// COLA PARA PETICIONES EN ESPERA DE REFRESH
// ===============================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// ===============================
// FUNCIÓN PARA LIMPIAR SESIÓN LOCAL
// ===============================

const clearSession = () => {
  sessionStorage.removeItem("user");
  window.dispatchEvent(new Event("userUpdate"));
};

// ===============================
// RESPONSE INTERCEPTOR
// ===============================

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ❌ Si la petición que falló es el propio refresh, no reintentar
    // Limpia sesión y rechaza — React Router redirige via AuthContext/PrivateRoute
    if (originalRequest.url === AUTH_ENDPOINTS.REFRESH) {
      clearSession();
      return Promise.reject(error);
    }

    // ❌ Si ya se reintentó una vez, no reintentar de nuevo
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si es la petición de login, no intentar refresh — pasar el error directo
    if (originalRequest.url === AUTH_ENDPOINTS.LOGIN) {
      return Promise.reject(error);
    }

    // Token expirado → intentar refrescar
    if (error.response?.status === 401) {

      // Si ya se está refrescando, encolar esta petición
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post(AUTH_ENDPOINTS.REFRESH);

        // Éxito: liberar la cola y reintentar la petición original
        processQueue(null);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Falló el refresh → limpiar sesión y rechazar
        // Sin window.location.href: el error llega al catch de la llamada original
        // (ej: useAbastecimiento carga datos mock), y AuthContext + PrivateRoute
        // redirigen al login via React Router cuando detecten el cambio.
        processQueue(refreshError);
        isRefreshing = false;

        clearSession();

        return Promise.reject(refreshError);
      }
    }

    // Error de red (sin conexión / backend caído)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      window.dispatchEvent(new Event('connectionError'));
    } else if (error.response?.status < 500) {
      // Si el backend responde normalmente, recovery implícito
      window.dispatchEvent(new Event('connectionRecover'));
    }

    // Acceso denegado (sin permisos)
    if (error.response?.status === 403) {
      console.warn("Acceso denegado — usuario sin permisos suficientes");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
