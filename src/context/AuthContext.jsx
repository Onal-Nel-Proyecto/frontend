// ================================================================
// AuthContext — Contexto de autenticación
// Fuente de verdad: httpOnly cookie + /auth/perfil (backend)
// sessionStorage se usa solo como caché rápida para el contexto.
// ================================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { verifySession } from "../features/auth/services/sesionService";
import { loginUser, logoutUser } from "../features/auth/services/authService";

const AuthContext = createContext(null);

/**
 * Proveedor de autenticación — envuelve la app.
 * En mount: intenta sessionStorage (rápido) y luego /auth/perfil (fuente de verdad).
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión al montar
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 1. Cache rápida desde sessionStorage
      try {
        const raw = sessionStorage.getItem("user");
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } catch {
        // ignorar
      }

      // 2. Fuente de verdad: backend
      try {
        const data = await verifySession();
        if (cancelled) return;
        const userData = data.user || data;
        setUser(userData);
        // Actualizar caché
        sessionStorage.setItem("user", JSON.stringify(userData));
        window.dispatchEvent(new Event("userUpdate"));
      } catch {
        // Token no válido o expirado — limpiar
        if (!cancelled) {
          sessionStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  /**
   * Login: el backend setea la httpOnly cookie,
   * nosotros solo guardamos los datos del usuario en contexto.
   */
  const login = useCallback(async (credenciales) => {
    const response = await loginUser(credenciales);
    const userData = response.data?.user || response.data;

    setUser({
      user_id: userData.id || userData.user_id,
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      rol: userData.rol,
    });

    // Cache para carga rápida en próximos mounts
    sessionStorage.setItem("user", JSON.stringify({
      user_id: userData.id || userData.user_id,
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      rol: userData.rol,
    }));
    window.dispatchEvent(new Event("userUpdate"));

    return userData;
  }, []);

  /**
   * Logout: backend invalida la cookie, frontend limpia contexto y caché.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Aunque falle el backend, limpiamos sesión local
    }
    setUser(null);
    sessionStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdate"));
  }, []);

  const isAdmin = user?.rol === "ADMINISTRADOR";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, authenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para consumir el contexto de autenticación.
 */
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  }
  return ctx;
};

export default AuthContext;
