import { FiHelpCircle, FiMenu } from 'react-icons/fi';
import { GiSewingNeedle } from "react-icons/gi";

import { motion } from 'framer-motion';

import styles from './header.module.css';
import navTabsStyles from './navTabs.module.css';
import UserDropdown from './UserDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import NavTabs from './NavTabs';

const Header = ({ onMenuClick }) => {
  return (
    <header className={styles.header}>

      <div className={styles.leftSection}>

        <button
          onClick={onMenuClick}
          className={styles.menuButton}
          title="Menú lateral"
        >
          <FiMenu />
        </button>

        <h1 className={styles.title}>
            <GiSewingNeedle />
            onal&nel
        </h1>

      </div>

      <NavTabs className={navTabsStyles.navDesktop} />

      <div className={styles.actions}>
        <NotificationsDropdown />
        <HeaderButton icon={<FiHelpCircle />} title="Ayuda / Help" />
        <UserDropdown />
      </div>

    </header>
  );
};

const HeaderButton = ({ icon, title = "" }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={styles.actionButton}
    title={title}
  >

    <span className={styles.actionIcon}>
      {icon}
    </span>

  </motion.button>
);


export default Header;