import 'react';

import { motion } from 'framer-motion';

import styles from './loading-pages.module.css';

const LoadingPage = ({
  title = 'Cargando información',
  message = 'Estamos preparando todo para ti...'
}) => {

  return (
    <div className={styles.container}>

      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: 'linear'
        }}
        className={styles.spinner}
      />

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .4 }}
        className={styles.title}
      >
        {title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .1, duration: .4 }}
        className={styles.message}
      >
        {message}
      </motion.p>

      <div className={styles.dots}>
        <span />
        <span />
        <span />
      </div>

    </div>
  );
};

export default LoadingPage;