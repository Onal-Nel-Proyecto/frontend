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

      // eslint-disable-next-line no-unused-vars
      } catch (error) {

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