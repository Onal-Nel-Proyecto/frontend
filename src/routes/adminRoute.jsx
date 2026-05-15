// ================================================================
// AdminRoute — Componente wrapper para rutas exclusivas de admin
// Si el usuario logueado NO tiene rol ADMINISTRADOR, redirige
// al dashboard. Se usa en AppRouter para proteger rutas como
// /config y /gestion-usuarios.
// ================================================================

import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "../utils/session";

const AdminRoute = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
