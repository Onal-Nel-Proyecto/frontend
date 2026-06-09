// ================================================================
// Dashboard — Página principal del sistema
// Muestra KPIs, actividades recientes, estado de pedidos (gráfico),
// stock crítico y acceso rápido a funcionalidades principales.
// ================================================================

import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiShoppingBag,
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiFileText,
  // FiTrendingUp,
  FiPlusCircle,
  FiUserPlus,
  FiShoppingCart,
  FiBarChart2,
  FiPackage,
  FiArrowRight,
  FiUser,
} from "react-icons/fi";
import Card from "../../components/common/Card";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { isAdmin } from "../../utils/session.js";
import { getDashboardResumen } from "../../api/endpoints/dashboardEndpoints";
import styles from "./home.module.css";

// ─── Configuración de las tarjetas KPI ───
// Cada objeto define: key (para mapear desde la API), label visible,
// icono de react-icons y color pastel asociado.
const kpiConfig = [
  { key: "activos", label: "Pedidos Activos", icon: <FiShoppingBag />, color: "var(--accent-blue)" },
  { key: "pendientes", label: "Pendientes", icon: <FiClock />, color: "var(--accent-amber)" },
  { key: "en_proceso", label: "En Proceso", icon: <FiActivity />, color: "var(--accent-violet)" },
  { key: "terminados", label: "Terminados", icon: <FiCheckCircle />, color: "var(--accent-emerald)" },
];

// Mapa de estados que vienen del backend → etiqueta + color para el gráfico
const estadoMap = {
  pendiente: { label: "Pendiente", color: "var(--accent-amber)" },
  en_proceso: { label: "En proceso", color: "var(--accent-violet)" },
  terminado: { label: "Terminado", color: "var(--accent-emerald)" },
};

// ─── Datos ahora vienen desde la API (getDashboardResumen) ───

// ─── Acciones de acceso rápido ───
// admin: true → solo visible para usuarios con rol ADMINISTRADOR
const actions = [
  { label: "Nuevo Pedido", icon: <FiPlusCircle />, path: "/pedidos", color: "#3b82f6", admin: false },
  { label: "Registrar Cliente", icon: <FiUserPlus />, path: "/gestion-clientes", color: "#8b5cf6", admin: false },
  { label: "Registrar Compra", icon: <FiShoppingCart />, path: "/compras", color: "#10b981", admin: false },
  { label: "Generar Reporte", icon: <FiBarChart2 />, path: "/ventas/reportes", color: "#f59e0b", admin: true },
];

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const Home = () => {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();

  // Estado: resumen de pedidos, datos para el gráfico y bandera de carga
  const [resumen, setResumen] = useState(null);
  const [pedidosEstado, setPedidosEstado] = useState([]);
  const [stockCritico, setStockCritico] = useState([]);
  const [actividadSistema, setActividadSistema] = useState([]);
  const [loading, setLoading] = useState(true);

  // Al montar el componente → pide datos al backend
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const resp = await getDashboardResumen();
        if (cancelled) return;
        setResumen(resp.data.resumen);               // { total_pedidos, pendientes, en_proceso, terminados, cancelados }
        setPedidosEstado(resp.data.pedidos_por_estado || []); // [{ estado, cantidad }, ...]
        setActividadSistema(resp.data.actividadSistema || []);
        setStockCritico(resp.data.stockCritico || []);
        setStockCritico(resp.data.stock_critico || []); // [{ estado, cantidad }, ...]
        setActividadSistema(resp.data.actividad_sistema || []); // [{ estado, cantidad }, ...]
      } catch {
        // Si falla la API el dashboard se muestra sin datos
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Mapear kpiConfig con valores reales desde la API
  const kpis = kpiConfig.map((cfg) => {
    let value = 0;
    if (resumen) {
      switch (cfg.key) {
        case "activos": value = resumen.total_pedidos - resumen.terminados; break;
        case "pendientes": value = resumen.pendientes; break;
        case "en_proceso": value = resumen.en_proceso; break;
        case "terminados": value = resumen.terminados; break;
      }
    }
    return { ...cfg, value };
  });

  // Filtrar y mapear estados que existen en estadoMap para el gráfico
const chartData = pedidosEstado
  .map((e) => {

    const key = e.estado
      .toLowerCase()
      .replace(/\s+/g, '_');

    const estado = estadoMap[key];

    if (!estado) return null;

    return {
      label: estado.label,
      value: e.cantidad,
      color: estado.color,
    };

  })
  .filter(Boolean);
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className={styles.page}>
      {/* ── Header de la página ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <h2 className={styles.title}>Dashboard</h2>
        <p className={styles.subtitle}>Resumen general del estado de la empresa</p>
      </motion.div>

      {/* ── Filas de KPIs ── */}
      <div className={styles.kpiRow}>
        {kpis.map((k, i) => {
          const { key, ...rest } = k;
          return <KPICard key={key} {...rest} delay={i * 0.06} loading={loading} />;
        })}
      </div>

      {/* ── Fila inferior: actividades + gráfico + acceso rápido ── */}
      <div className={styles.bottomRow}>
        <SystemActivities actividades={actividadSistema} />
        <div className={styles.middleCol}>
          <EstadoPedidos data={chartData} total={chartTotal} />
          <StockCritico stock={stockCritico} navigate={navigate} />
        </div>
        <QuickActions navigate={navigate} />
      </div>
    </div>
  );
};

// ================================================================
// SU-COMPONENTES
// ================================================================

// ─── Tarjeta KPI individual ───
// Muestra un icono con fondo coloreado, una etiqueta y el valor numérico.
// loading = true → muestra un skeleton animado en lugar del número.
const KPICard = memo(({ label, value, icon, color, delay, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={styles.kpiWrapper}
  >
    <Card className={styles.kpiCard}>
      {/* Círculo decorativo en la esquina superior derecha */}
      <div className={styles.kpiGlow} style={{ background: color }} />
      <div className={styles.kpiBody}>
        <div className={styles.kpiIcon} style={{ background: `${color}25`, color, boxShadow: `${color}30 0 0 12px` }}>
          {icon}
        </div>
        <div className={styles.kpiInfo}>
          <p className={styles.kpiTitle}>{label}</p>
          <h4 className={styles.kpiValue}>
            {loading ? (
              <span className={styles.kpiSkeleton}>&nbsp;</span>
            ) : (
              value
            )}
          </h4>
        </div>
      </div>
    </Card>
  </motion.div>
));

// ─── Actividades del Sistema ───
// Lista de alertas/notificaciones con icono coloreado según el tipo.
// Cada activity tiene: tipo (critical/warning/info/blue/success), mensaje y tiempo.
const moduloStyle = {
  PEDIDOS: { bg: "rgba(167, 139, 250, 0.08)", text: "var(--accent-violet)", icon: <FiShoppingBag /> },
  INVENTARIO: { bg: "rgba(251, 191, 36, 0.08)", text: "var(--accent-amber)", icon: <FiPackage /> },
  COMPRAS: { bg: "rgba(52, 211, 153, 0.08)", text: "var(--accent-emerald)", icon: <FiFileText /> },
  USUARIOS: { bg: "rgba(96, 165, 250, 0.08)", text: "var(--accent-blue)", icon: <FiUser /> },
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return formatDate(dateStr);
};

const SystemActivities = memo(({ actividades }) => (
  <Card className={styles.activitiesCard}>
    <h3 className={styles.sectionTitle}>Actividades del Sistema</h3>
    <div className={styles.activityList}>
      {actividades.length > 0 ? (
        actividades.map((a) => {
          const s = moduloStyle[a.modulo] || { bg: "rgba(167, 139, 250, 0.08)", text: "var(--accent-violet)", icon: <FiActivity /> };
          return (
            <div key={a.actId} className={styles.activityItem}>
              <div className={styles.activityIcon} style={{ background: s.bg, color: s.text }}>
                {s.icon}
              </div>
              <div className={styles.activityBody}>
                <p className={styles.activityMsg}>{a.descripcion}</p>
                <p className={styles.activityTime}>{a.usuario} &middot; {formatRelativeTime(a.fecha)}</p>
              </div>
            </div>
          );
        })
      ) : (
        <p className={styles.chartEmpty}>Sin actividades recientes</p>
      )}
    </div>
  </Card>
));

// ─── Gráfico de Estado de Pedidos ───
// SVG donut minimalista con arcos. Al hacer hover sobre un segmento
// se muestra un tooltip con la etiqueta y la cantidad.
const EstadoPedidos = ({ data, total }) => {
  const [hovered, setHovered] = useState(null);
  const r = 60;   // radio del arco
  const cx = 75;  // centro X del SVG
  const cy = 75;  // centro Y del SVG

  // Convierte grados a coordenadas cartesianas (para dibujar el arco SVG)
  const polar = (cx, cy, r, deg) => ({
    x: cx + r * Math.cos((deg - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((deg - 90) * (Math.PI / 180)),
  });

  // Calcular los arcos: cada segmento ocupa (value/total)*360 grados
  let cum = 0;
  const arcs = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const a = pct * 360;
    const start = cum;
    cum += a;
    return { ...d, start, end: cum, pct: pct * 100 };
  });

  return (
    <Card className={styles.chartCard}>
      <h3 className={styles.sectionTitle}>Estado de pedidos</h3>
      {total === 0 && !data.length ? (
        <p className={styles.chartEmpty}>Sin datos disponibles</p>
      ) : (
        <div className={styles.chartBody}>
          {/* SVG del donut */}
          <div className={styles.svgWrapper}>
            <svg width={150} height={150} viewBox="0 0 150 150" role="img" aria-label={`Gráfico de estado de pedidos: ${arcs.map(s => `${s.label} ${Math.round(s.pct)}%`).join(', ')}`}>
              {arcs.map((seg) => {
                if (seg.start === seg.end) return null;

                // Cuando un segmento ocupa ~100% del círculo, el arco SVG
                // degenera en un punto porque inicio y fin coinciden.
                // Usamos un <circle> en su lugar.
                if (seg.end - seg.start >= 359.99) {
                  return (
                    <circle
                      key={seg.label}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={14}
                      className={styles.arc}
                      style={{ opacity: hovered && hovered !== seg.label ? 0.25 : 1 }}
                      onMouseEnter={() => setHovered(seg.label)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                }

                const s = polar(cx, cy, r, seg.start);
                const e = polar(cx, cy, r, seg.end);
                const large = seg.end - seg.start > 180 ? 1 : 0;
                const d = [
                  `M ${s.x} ${s.y}`,
                  `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
                ].join(" ");
                return (
                  <path
                    key={seg.label}
                    d={d}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={14}
                    strokeLinecap="round"
                    className={styles.arc}
                    style={{ opacity: hovered && hovered !== seg.label ? 0.25 : 1 }}
                    onMouseEnter={() => setHovered(seg.label)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
              {/* Texto centrado: total de pedidos */}
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--text-dark)">
                {total}
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--text-soft)">
                Total
              </text>
            </svg>
            {/* Tooltip que aparece al hacer hover sobre un arco */}
            {hovered && (
              <div className={styles.chartTooltip}>
                <span className={styles.tooltipDot} style={{ background: data.find((c) => c.label === hovered)?.color }} />
                <span>{hovered}: <strong>{data.find((c) => c.label === hovered)?.value}</strong></span>
              </div>
            )}
          </div>
          {/* Leyenda lateral con puntos de color */}
          <div className={styles.legend}>
            {arcs.map((c) => (
              <div key={c.label} className={styles.legendRow}>
                <span className={styles.legendDot} style={{ background: c.color }} />
                <span className={styles.legendLabel}>{c.label}</span>
                <span className={styles.legendValue}>{Math.round(c.pct)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ─── Stock Crítico ───
// Muestra 3 productos con cantidad actual, barra de progreso
// y un enlace para ver el inventario completo.
const StockCritico = memo(({ stock, navigate }) => (
  <Card className={styles.stockCard}>
    <h3 className={styles.sectionTitle}>Stock Crítico</h3>
    <div className={styles.stockList}>
      {stock.length > 0 ? (
        stock.map((item) => {
          const pct = Math.min((item.cantidad / item.max) * 100, 100);
          const barColor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f97316' : '#f59e0b';
          return (
            <div key={item.nombre} className={styles.stockItem}>
              <div className={styles.stockHeader}>
                <span className={styles.stockName}>
                  <FiPackage className={styles.stockIcon} style={{ color: barColor }} />
                  {item.nombre}
                </span>
                <span className={styles.stockQty} style={{ color: barColor }}>{item.cantidad} uds</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <p className={styles.chartEmpty}>Sin stock crítico</p>
      )}
    </div>
    <button className={styles.stockLink} onClick={() => navigate("/inventario")}>
      <FiArrowRight /> Ver Inventario
    </button>
  </Card>
));

// ─── Acceso Rápido ───
// Botones con icono + texto. Los items con admin:true solo se muestran
// si el usuario logueado tiene rol ADMINISTRADOR.
const QuickActions = memo(({ navigate }) => {
  const admin = isAdmin();
  return (
    <div className={styles.actionsCol}>
      <h3 className={styles.sectionTitle}>Acceso Rápido</h3>
      <div className={styles.actionsGrid}>
        {actions
          .filter((a) => !a.admin || admin)
          .map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className={styles.actionBtn}
              onClick={() => navigate(a.path, { state: { openForm: true } })}
            >
              <Card className={styles.actionCard} as="div">
                <div className={styles.actionIconBox} style={{ background: `${a.color}14`, color: a.color }}>
                  <div className={styles.actionIcon}>{a.icon}</div>
                </div>
                <span className={styles.actionLabel}>{a.label}</span>
              </Card>
            </motion.button>
          ))}
      </div>
    </div>
  );
});

export default Home;
