// ================================================================
// AdminRoute — Componente wrapper para rutas exclusivas de admin
// Si el usuario logueado NO tiene rol ADMINISTRADOR, redirige
// al dashboard. Se usa en AppRouter para proteger rutas como
// /config y /gestion-usuarios.
// ================================================================

import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const AdminRoute = () => {
  const { isAdmin } = useAuthContext();
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
