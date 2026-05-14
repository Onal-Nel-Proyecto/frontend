import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPackage,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiBell,
  FiCalendar,
  FiMessageSquare,
  FiShoppingBag,
  FiAlertTriangle,
  FiUserPlus,
  FiPlus
} from "react-icons/fi";
import Card from "../../components/common/Card";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import styles from "./home.module.css";

// ─── Datos de ejemplo ───

const stats = [
  { label: "Pedidos Activos", value: 12, icon: <FiPackage />, color: "var(--pastel-blue)" },
  { label: "Pendientes", value: 5, icon: <FiClock />, color: "var(--pastel-orange)" },
  { label: "En Producción", value: 4, icon: <FiTrendingUp />, color: "var(--pastel-violet)" },
  { label: "Entregados", value: 18, icon: <FiCheckCircle />, color: "var(--pastel-green)" },
];

const alertas = [
  { icon: <FiAlertCircle />, texto: "3 pedidos están atrasados en la fecha de entrega", tipo: "error" },
  { icon: <FiBell />, texto: "Tienes 2 pedidos nuevos sin revisar", tipo: "info" },
  { icon: <FiCalendar />, texto: "Entrega programada para mañana: Pedido #PD012", tipo: "warning" },
  { icon: <FiMessageSquare />, texto: "Cliente 'María García' solicitó cambios en su pedido", tipo: "info" },
  { icon: <FiAlertTriangle />, texto: "Stock bajo en tela de algodón", tipo: "warning" },
];

const estadosPedido = [
  { label: "Pendiente", porcentaje: 35, color: "var(--pastel-orange)" },
  { label: "En proceso", porcentaje: 45, color: "var(--pastel-violet)" },
  { label: "Terminado", porcentaje: 20, color: "var(--pastel-green)" },
];

const acciones = [
  { label: "Nuevo Pedido", icon: <FiShoppingBag />, path: "/pedidos" },
  { label: "Registrar Cliente", icon: <FiUserPlus />, path: "/gestion-clientes" },
];

// ─── Donut Chart ───

const DonutChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((s, d) => s + d.porcentaje, 0);

  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += (d.porcentaje / total) * 360;
    return { ...d, start, end: cumulative };
  });

  const radius = 70;
  const cx = 90;
  const cy = 90;
  const strokeWidth = 22;

  const polarToCartesian = (cx, cy, r, angleDeg) => ({
    x: cx + r * Math.cos((angleDeg - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angleDeg - 90) * (Math.PI / 180)),
  });

  const describeArc = (start, end) => {
    const startPt = polarToCartesian(cx, cy, radius, start);
    const endPt = polarToCartesian(cx, cy, radius, end);
    const largeArc = end - start > 180 ? 1 : 0;
    return [
      `M ${startPt.x} ${startPt.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`,
      `L ${cx} ${cy}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className={styles.chartWrapper}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        {segments.map((seg) => (
          <path
            key={seg.label}
            d={describeArc(seg.start, seg.end)}
            fill={seg.color}
            opacity={hovered === seg.label ? 0.85 : 1}
            className={styles.chartSegment}
            onMouseEnter={() => setHovered(seg.label)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered && (() => {
        const seg = segments.find((s) => s.label === hovered);
        return (
          <div
            className={styles.tooltip}
            style={{ "--tooltip-bg": seg.color }}
          >
            <span className={styles.tooltipDot} style={{ background: seg.color }} />
            <span>{seg.label}: <strong>{seg.porcentaje}%</strong></span>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Componente principal ───

const Home = () => {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard</h2>
        <p className={styles.subtitle}>
          Resumen general del sistema y actividades recientes
        </p>
      </div>

      {/* Fila de estadísticas */}
      <div className={styles.statsRow}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={styles.statCard}
          >
            <Card className={styles.statInner}>
              <div
                className={styles.statIcon}
                style={{ background: `${s.color}22`, color: s.color }}
              >
                {s.icon}
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Segunda fila: actividades + gráfico + acciones */}
      <div className={styles.bottomRow}>
        {/* Actividades del sistema */}
        <Card className={styles.activitiesCard}>
          <h3 className={styles.cardTitle}>Actividades del sistema</h3>
          <ul className={styles.alertList}>
            {alertas.slice(0, 5).map((a, i) => (
              <li key={i} className={styles.alertItem}>
                <span className={`${styles.alertIcon} ${styles[a.tipo]}`}>
                  {a.icon}
                </span>
                <span className={styles.alertText}>{a.texto}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Estado de pedidos (gráfico) */}
        <Card className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Estado de pedidos</h3>
          <DonutChart data={estadosPedido} />
          <div className={styles.chartLegend}>
            {estadosPedido.map((e) => (
              <span key={e.label} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: e.color }}
                />
                {e.label}
              </span>
            ))}
          </div>
        </Card>

        {/* Acciones rápidas */}
        <div className={styles.actionsCol}>
          {acciones.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className={styles.actionBtn}
              onClick={() => navigate(a.path)}
            >
              <Card className={styles.actionCard} as="div">
                <div className={styles.actionIcon}>{a.icon}</div>
                <span className={styles.actionLabel}>{a.label}</span>
              </Card>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
