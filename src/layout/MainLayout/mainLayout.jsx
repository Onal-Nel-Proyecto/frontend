import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import styles from './main-layout.module.css';
import navTabsStyles from '../../components/ui/Header/navTabs.module.css';
import Sidebar from '../../components/ui/Sidebar/Sidebar';
import Header from '../../components/ui/Header/Header';
import NavTabs from '../../components/ui/Header/NavTabs';
import ConnectionBanner from '../../components/ui/feedback/ConnectionBanner';


const MainLayout = () => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>

      {/* Barra de conectividad (offline / backend caído) */}
      <ConnectionBanner />

      {/* Skip-to-content: visible solo al recibir foco por teclado */}
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role="navigation"
        aria-label="Menú de navegación principal"
      />

      <div className={styles.contentWrapper}>

        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          role="banner"
        />

        <main className={styles.mainContent} role="main" id="main-content">

          <div className={styles.container}>
            <Outlet />
          </div>

        </main>

      </div>

      {/* NavTabs versión móvil — barra inferior fija */}
      <NavTabs className={navTabsStyles.navMobile} />

    </div>
  );
};

export default MainLayout;