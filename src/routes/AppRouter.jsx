import { lazy, Suspense } from "react";
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import { Route, Routes } from "react-router";
import ErrorBoundary from "../components/ui/feedback/ErrorBoundary";
import { DashSkeleton } from "../components/ui/feedback/SkeletonLoader";
import Login from "../features/auth/pages/login";
import Home from "../page/Home";
import PrivateRoute from "./privateRoute";
import PublicRoute from "./publicRoute";
import AdminRoute from "./adminRoute";
import NotFound from "../page/NotFount";
import MainLayout from "../layout/MainLayout/mainLayout";
import ClientDirectory from "../page/ClientDirectory";
import VentaSeleccionada from "../features/ventas/pages/VentaSeleccionada";
import Pedidos from "../features/pedidos/pages/Pedidos";
import PedidoSeleccionado from "../features/pedidos/pages/PedidoSeleccionado";
import DetallePedido from "../features/pedidos/components/DetallePedido";
import Produccion from "../features/pedidos/components/Produccion";
import Pagos from "../features/pedidos/components/Pagos";
import GestionUsuarios from "../page/GestionUsuarios";
import InConstruction from "../components/ui/feedback/InConstruction/InConstruction";
import Entregas from "../features/pedidos/pages/Entregas";

// ─── Rutas pesadas → lazy loading ───
const DashboardPedidos = lazy(() => import("../features/pedidos/pages/Dashboard"));
const GestionPersonal = lazy(() => import("../page/GestionPersonal"));
const InventarioPage = lazy(() => import("../page/Inventario/InventarioPage"));
const VentasPage = lazy(() => import("../page/Ventas/VentasPage"));
const Config = lazy(() => import("../page/Config"));
const CategoriaPage = lazy(() => import("../page/categoria/CategoriaPage"));
const MedidasPage = lazy(() => import("../page/medidas/MedidasPage"));
const ReportesVentas = lazy(() => import("../features/ventas/pages/Reportes"));

const LoadingFallback = () => (
  <div style={{ padding: '2rem' }}>
    <DashSkeleton cards={4} />
  </div>
);

const AppRoutes = () => {
  return (
    <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
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
          <Route path="/pedidos/entregas" element={<Entregas />} />

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

        {/* RUTAS SOLO ADMIN */}
        <Route element={<AdminRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
          <Route path="/config" element={<Config />} />
          <Route path="/ventas/reportes" element={<ReportesVentas />} />
          <Route path="/config/categorias" element={<CategoriaPage />} />
          <Route path="/config/copia-seguridad" element={<InConstruction title="Copia de seguridad" />} />
          <Route path="/config/medidas" element={<MedidasPage />} />
        </Route>
      </Route>
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
