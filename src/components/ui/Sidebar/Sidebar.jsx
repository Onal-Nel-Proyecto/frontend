// ================================================================
// Sidebar — Barra de navegación lateral
// Muestra enlaces a las secciones principales del sistema.
// El footer con "Configuración" solo es visible para administradores.
// ================================================================

import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiUsers,
  FiSettings,
  FiX
} from 'react-icons/fi';

import styles from './sidebar.module.css';
import { isAdmin } from '../../../utils/session';

const Sidebar = ({ isOpen, onClose }) => {

  // Forzar re-render cuando cambie el usuario (login/logout)
  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("userUpdate", refresh);
    return () => window.removeEventListener("userUpdate", refresh);
  }, []);

  const esAdmin = isAdmin();

  // Ítems del menú principal (visibles para todos los roles)
  const menuItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
    { name: 'Pedidos', icon: <FiShoppingBag />, path: '/pedidos' },
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
            <button onClick={onClose} className={styles.closeButton}>
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
          {esAdmin && (
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
const SidebarItem = ({ item, onClose }) => (
  <NavLink
    to={item.path}
    onClick={onClose}
    className={({ isActive }) =>
      `${styles.navItem} ${isActive ? styles.active : styles.inactive}`
    }
  >
    <span className={styles.icon}>{item.icon}</span>
    <span className={styles.label}>{item.name}</span>
  </NavLink>
);

export default Sidebar;
