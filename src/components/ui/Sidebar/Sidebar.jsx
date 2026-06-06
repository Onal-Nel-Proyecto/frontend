// ================================================================
// Sidebar — Barra de navegación lateral
// Muestra enlaces a las secciones principales del sistema.
// El footer con "Configuración" solo es visible para administradores.
// ================================================================

import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiUsers,
  FiSettings,
  FiX,
  FiArchive
} from 'react-icons/fi';

import styles from './sidebar.module.css';
import { useAuthContext } from '../../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin } = useAuthContext();

  // Ítems del menú principal (visibles para todos los roles)
  const menuItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
    { name: 'Pedidos', icon: <FiShoppingBag />, path: '/pedidos/dash' },
    { name: 'Inventario', icon: <FiArchive />, path: '/inventario' },
    { name: 'Ventas', icon: <FiShoppingBag />, path: '/ventas' },
    { name: 'Gestión Personal', icon: <FiUsers />, path: '/gestion-personal' },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.container}>
          {/* Header móvil */}
          <div className={styles.mobileHeader}>
            <span className={styles.title}>Menú</span>
            <button onClick={onClose} className={styles.closeButton} aria-label="Cerrar menú">
              <FiX />
            </button>
          </div>

          {/* Navegación principal */}
          <nav className={styles.nav}>
            {menuItems.map((item) => (
              <SidebarItem key={item.name} item={item} onClose={onClose} />
            ))}
          </nav>

          {/* Footer: Configuración — solo admin */}
          {isAdmin && (
            <div className={styles.footer}>
              <SidebarItem
                item={{ name: 'Configuración', icon: <FiSettings />, path: '/config' }}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// Componente interno para cada ítem del menú
const SidebarItem = ({ item, onClose }) => {
  const loc = useLocation();
  const isActive = loc.pathname === item.path || loc.pathname.startsWith(item.path + '/');
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive: active }) =>
        `${styles.navItem} ${active ? styles.active : styles.inactive}`
      }
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.icon}>{item.icon}</span>
      <span className={styles.label}>{item.name}</span>
    </NavLink>
  );
};

export default Sidebar;
