import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../features/auth/hooks/usuAuth.js";  
import LoadingPage from "../components/ui/feedback/LoadingPages/index.jsx";

const PublicRoute = () => {

  const {
    authenticated,
    loading,
  } = useAuth();



  if (loading) {

    return <LoadingPage title="Cargando pagina..." message="Esto puede tardar unos segundos"/>;
  }



  return authenticated
    ? <Navigate to="/dashboard" />
    : <Outlet />;
};

export default PublicRoute;