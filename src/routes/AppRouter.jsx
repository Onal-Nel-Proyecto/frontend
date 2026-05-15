import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import { Route, Routes } from "react-router";
import Login from "../features/auth/pages/login";
import Home from "../page/Home";
import PrivateRoute from "./privateRoute";
import PublicRoute from "./publicRoute";
import NotFound from "../page/NotFount";
import MainLayout from "../layout/MainLayout/mainLayout";
import GestionPersonal from "../page/GestionPersonal";
import ClientDirectory from "../page/ClientDirectory";
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

      {/* ClientDirectory con su propio layout (sidebar + topbar) */}
      <Route
        path="/gestion-clientes"
        element={<ClientDirectory />}
      />

      <Route path="/" element={<MainLayout />}>
        {/* PRIVATE ROUTES */}
        <Route element={<PrivateRoute />}>

          <Route
            path="/dashboard"
            element={<Home />}
          />
          <Route
            path="/pedidos"
            element={<InConstruction title="Pedidos" />}
          />
          <Route
            path="/gestion-personal"
            element={<GestionPersonal />}
          />
          <Route
            path="/gestion-usuarios"
            element={<InConstruction title="Usuarios" />}
          />
          <Route
            path="/config"
            element={<InConstruction title="Configuración" />}
          />
        </Route>
      </Route>
    </Routes>

  );
};

export default AppRoutes;
