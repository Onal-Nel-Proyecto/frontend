import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "../utils/session";

const AdminRoute = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
