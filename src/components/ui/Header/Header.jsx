import 'react';
import {
  FiBell,
  FiHelpCircle,
  FiUser,
  FiMenu
} from 'react-icons/fi';
import { GiSewingNeedle } from "react-icons/gi";

import { motion } from 'framer-motion';

import styles from './header.module.css';

const Header = ({ onMenuClick }) => {

  return (
    <header className={styles.header}>

      <div className={styles.leftSection}>

        <button
          onClick={onMenuClick}
          className={styles.menuButton}
        >
          <FiMenu />
        </button>

        <h1 className={styles.title}>
            <GiSewingNeedle />
            onal&nel
        </h1>

      </div>

      <div className={styles.actions}>
        <HeaderButton icon={<FiBell />} />
        <HeaderButton icon={<FiHelpCircle />} />
        <HeaderButton icon={<FiUser />} />
      </div>

    </header>
  );
};

const HeaderButton = ({ icon }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={styles.actionButton}
  >

    <span className={styles.actionIcon}>
      {icon}
    </span>

  </motion.button>
);


export default Header;