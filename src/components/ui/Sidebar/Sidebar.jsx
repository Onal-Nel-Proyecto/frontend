import 'react';
import { NavLink } from 'react-router-dom';
// import { motion } from 'framer-motion';
import {
  FiHome,
  FiShoppingBag,
  FiUsers,
  FiSettings,
  FiX
} from 'react-icons/fi';

import styles from './sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {

  const menuItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
    { name: 'Pedidos', icon: <FiShoppingBag />, path: '/pedidos' },
    { name: 'Gestión Personal', icon: <FiUsers />, path: '/gestion-personal' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          isOpen ? styles.sidebarOpen : styles.sidebarClosed
        }`}
      >

        <div className={styles.container}>

          <div className={styles.mobileHeader}>
            <span className={styles.title}>Menú</span>

            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              <FiX />
            </button>
          </div>

          {/* <div className={styles.desktopIndicator}>
            <div className={styles.indicatorBar} />
          </div> */}

          <nav className={styles.nav}>
            {
              menuItems.map(item => (
                <SidebarItem
                  key={item.name}
                  item={item}
                  onClose={onClose}
                />
              ))
            }
          </nav>

          <div className={styles.footer}>
            <SidebarItem
              item={{
                name: 'Configuración',
                icon: <FiSettings />,
                path: '/config'
              }}
              onClose={onClose}
            />
          </div>

        </div>

      </aside>
    </>
  );
};

const SidebarItem = ({ item, onClose }) => (
  <NavLink
    to={item.path}
    onClick={onClose}
    className={({ isActive }) =>
      `${styles.navItem} ${
        isActive ? styles.active : styles.inactive
      }`
    }
  >

    <span className={styles.icon}>
      {item.icon}
    </span>

    <span className={styles.label}>
      {item.name}
    </span>


    {/* <motion.div
      layoutId='active-indicator'
      className={styles.dot}
    /> */}
  </NavLink>
);

export default Sidebar;