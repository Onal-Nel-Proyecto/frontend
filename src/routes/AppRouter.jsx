import { Navigate, Route, Routes } from "react-router";
import Login from "../features/auth/pages/login";
import Home from "../page/Home";
import PrivateRoute from "./privateRoute";
import PublicRoute from "./publicRoute";
import AdminRoute from "./adminRoute";
import NotFound from "../page/NotFount";
import MainLayout from "../layout/MainLayout/mainLayout";
import GestionPersonal from "../page/GestionPersonal";
import Config from "../page/Config";
import InConstruction from "../components/ui/feedback/InConstruction/InConstruction";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
      {/* PUBLIC ROUTES */}
      <Route element={<PublicRoute />}>

        <Route
          path="/login"
          element={<Login />}
        />

      </Route>


      {/* PRIVATE ROUTES */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            index
            path="/dashboard"
            element={<Home />}
          />
          <Route
            path="/pedidos/dash"
            element={<InConstruction title="Pedidos - Inicio" />}
          />
          <Route
            path="/pedidos/pedidos"
            element={<InConstruction title="Pedidos" />}
          />
          <Route
            path="/pedidos/entregas"
            element={<InConstruction title="Entregas" />}
          />
          <Route
            path="/gestion-personal"
            element={<GestionPersonal />}
          />
          <Route
            path="/gestion-clientes"
            element={<InConstruction title="Clientes" />}
          />
        </Route>

        {/* RUTAS SOLO ADMIN */}
        <Route element={<AdminRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route
            path="/gestion-usuarios"
            element={<InConstruction title="Usuarios" />}
          />
          <Route
            path="/config"
            element={<Config />}
          />
          <Route
            path="/config/categorias"
            element={<InConstruction title="Categorías" />}
          />
          <Route
            path="/config/copia-seguridad"
            element={<InConstruction title="Copia de seguridad" />}
          />
          <Route
            path="/config/medidas"
            element={<InConstruction title="Medidas" />}
          />
        </Route>
        </Route>
      </Route>
    </Routes>

  );
};

export default AppRoutes;
