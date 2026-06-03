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
import VentaSeleccionada from "../features/ventas/pages/VentaSeleccionada";

import Pedidos from "../page/Pedidos";
import PedidoSeleccionado from "../features/pedidos/pages/PedidoSeleccionado";
import DetallePedido from "../features/pedidos/components/DetallePedido";
import Produccion from "../features/pedidos/components/Produccion";
import Pagos from "../features/pedidos/components/Pagos";
import Config from "../page/Config";
import GestionUsuarios from "../page/GestionUsuarios";
import InConstruction from "../components/ui/feedback/InConstruction/InConstruction";

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
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/:id" element={<PedidoSeleccionado />}>
            <Route index element={<DetallePedido />} />
            <Route path="produccion" element={<Produccion />} />
            <Route path="pagos" element={<Pagos />} />
          </Route>
          <Route path="/pedidos/entregas" element={<InConstruction title="Entregas" />} />

          {/* Inventario */}
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/inventario/materiales" element={<InventarioPage tipo="materiales" />} />
          <Route path="/inventario/productos" element={<InventarioPage tipo="productos" />} />
          <Route path="/inventario/abastecimiento" element={<InventarioPage tipo="abastecimiento" />} />

          {/* Ventas */}
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/ventas/:id" element={<VentaSeleccionada />} />

          {/* Personal */}
          <Route path="/gestion-personal" element={<GestionPersonal />} />
        </Route>
      </Route>

      {/* ── SÓLO ADMIN ── */}
      <Route element={<AdminRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
          <Route path="/config" element={<Config />} />
          <Route path="/config/categorias" element={<InConstruction title="Categorías" />} />
          <Route path="/config/copia-seguridad" element={<InConstruction title="Copia de seguridad" />} />
          <Route path="/config/medidas" element={<InConstruction title="Medidas" />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
