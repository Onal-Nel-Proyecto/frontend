import { useState } from 'react';
import { Outlet } from 'react-router-dom';


import styles from './main-layout.module.css';
import Sidebar from '../../components/ui/Sidebar/Sidebar';
import Header from '../../components/ui/Header/Header';

const MainLayout = () => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={styles.contentWrapper}>

        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className={styles.mainContent}>

          <div className={styles.container}>
            <Outlet />
          </div>

        </main>

      </div>

    </div>
  );
};

export default MainLayout;