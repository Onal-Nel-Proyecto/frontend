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
  FiPackage,
} from 'react-icons/fi';
import { TfiRulerPencil } from "react-icons/tfi";
import { isAdmin } from '../../../utils/session.js';
import styles from './navTabs.module.css';

const modules = [
  {
    path: '/pedidos',
    tabs: [
      { label: 'Inicio',    to: '/pedidos/dash', icon: <FiHome /> },
      { label: 'Pedidos',   to: '/pedidos', icon: <FiShoppingBag />, matchPattern: /^\/pedidos\/(?!dash$|entregas).+/ },
      { label: 'Entregas',  to: '/pedidos/entregas', icon: <FiTruck /> },
    ],
  },
  {
    path: '/inventario',
    tabs: [
      { label: 'Materiales',     to: '/inventario/materiales',     icon: <FiPackage /> },
      { label: 'Productos',      to: '/inventario/productos',      icon: <FiShoppingBag /> },
      { label: 'Abastecimiento', to: '/inventario/abastecimiento', icon: <FiTruck /> },
    ],
  },
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
            `${styles.tab} ${
              /* activar también cuando la ruta es /pedidos/:id */
              isActive || (tab.matchPattern && tab.matchPattern.test(pathname))
                ? styles.active
                : ''
            }`
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
