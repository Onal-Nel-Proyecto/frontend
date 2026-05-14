// ================================================================
// NavTabs — Pestañas de navegación secundaria
// Renderiza los tabs del módulo activo.
// El padre controla el posicionamiento vía className.
// ================================================================

import { useLocation, NavLink } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiHardDrive,
} from 'react-icons/fi';
import { TfiRulerPencil } from "react-icons/tfi";
import { isAdmin } from '../../../utils/session.js';
import styles from './navTabs.module.css';

const modules = [
  {
    path: '/pedidos',
    tabs: [
      { label: 'Inicio',    to: '/pedidos',          icon: <FiHome /> },
      { label: 'Pedidos',   to: '/pedidos/pedidos',  icon: <FiShoppingBag /> },
      { label: 'Entregas',  to: '/pedidos/entregas', icon: <FiTruck /> },
    ],
  },
  // {
  //   path: '/gestion-personal',
  //   tabs: [
  //     { label: 'Inicio',    to: '/gestion-personal',  icon: <FiHome /> },
  //     { label: 'Clientes',  to: '/gestion-clientes',  icon: <FiUsers /> },
  //     { label: 'Usuarios',  to: '/gestion-usuarios',  icon: <FiUserCheck />, adminOnly: true },
  //   ],
  // },
  // {
  //   path: '/config',
  //   tabs: [
  //     { label: 'Inicio',          to: '/config',               icon: <FiHome /> },
  //     { label: 'Categorías',      to: '/config/categorias',     icon: <FiGrid /> },
  //     { label: 'Copia Seguridad', to: '/config/copia-seguridad', icon: <FiHardDrive /> },
  //     { label: 'Medidas',         to: '/config/medidas',        icon: <TfiRulerPencil /> },
  //   ],
  // },
];

const NavTabs = ({ className = '' }) => {
  const { pathname } = useLocation();
  const admin = isAdmin();

  const activeModule = modules.find((m) => pathname.startsWith(m.path));
  if (!activeModule) return null;

  const tabs = activeModule.tabs.filter((t) => !t.adminOnly || admin);

  return (
    <nav className={`${styles.nav} ${className}`}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === activeModule.path}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default NavTabs;
