import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import { Route, Routes } from "react-router";
import Login from "../features/auth/pages/login";
import Home from "../page/Home";
import PrivateRoute from "./privateRoute";
import PublicRoute from "./publicRoute";
import AdminRoute from "./adminRoute";
import NotFound from "../page/NotFount";
import MainLayout from "../layout/MainLayout/mainLayout";
import GestionPersonal from "../page/GestionPersonal";
import ClientDirectory from "../page/ClientDirectory";
import InventarioPage from "../page/Inventario/InventarioPage";
import VentasPage from "../page/Ventas/VentasPage";

import Pedidos from "../features/pedidos/pages/Pedidos";
import DashboardPedidos from "../features/pedidos/pages/Dashboard";
import PedidoSeleccionado from "../features/pedidos/pages/PedidoSeleccionado";
import DetallePedido from "../features/pedidos/components/DetallePedido";
import Produccion from "../features/pedidos/components/Produccion";
import Pagos from "../features/pedidos/components/Pagos";
import Config from "../page/Config";
import CategoriaPage from "../page/categoria/CategoriaPage";
import MedidasPage from "../page/medidas/MedidasPage";
import ReportesVentas from "../features/ventas/pages/Reportes";
import InConstruction from "../components/ui/feedback/InConstruction/InConstruction";
import Entregas from "../features/pedidos/pages/Entregas";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />

      {/* ── PÚBLICAS ── */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* ── PRIVADAS ── */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Home />} />

          {/* Clientes */}
          <Route path="/gestion-clientes" element={<ClientDirectory />} />

          {/* Pedidos */}
          <Route path="/pedidos/dash" element={<DashboardPedidos />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/:id" element={<PedidoSeleccionado />}>
            <Route index element={<DetallePedido />} />
            <Route path="produccion" element={<Produccion />} />
            <Route path="pagos" element={<Pagos />} />
          </Route>
          <Route
            path="/pedidos/entregas"
            element={<Entregas />}
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
          <Route path="/gestion-usuarios" element={<InConstruction title="Usuarios" />} />
          <Route path="/config" element={<Config />} />
          <Route path="/ventas/reportes" element={<ReportesVentas />} />
          <Route path="/config/categorias" element={<CategoriaPage />} />
          <Route path="/config/copia-seguridad" element={<InConstruction title="Copia de seguridad" />} />
          <Route path="/config/medidas" element={<MedidasPage />} />
        </Route>
      </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
