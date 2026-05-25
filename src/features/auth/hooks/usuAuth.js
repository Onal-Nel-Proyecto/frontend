import { useEffect, useState } from "react";
import { verifySession } from "../services/sesionService.js";


export const useAuth = () => {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const checkSession = async () => {

      try {

        const data = await verifySession();

        setUser(data.user);

        // Sincronizar sessionStorage para que otros componentes lo lean
        sessionStorage.setItem("user", JSON.stringify(data.user));
        // Disparar evento para que el Header (y otros) se actualicen sin polling
        window.dispatchEvent(new Event("userUpdate"));

      // eslint-disable-next-line no-unused-vars
      } catch (error) {

        // Si falla la verificación (token expirado, etc.), limpiar
        sessionStorage.removeItem("user");
        setUser(null);

      } finally {

        setLoading(false);
      }
    };

    checkSession();

  }, []);



  return {
    user,
    loading,
    authenticated: !!user,
  };
};