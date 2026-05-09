import { motion } from 'framer-motion';
import {
  FiAlertCircle,
  FiArrowLeft
} from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';

import styles from './in-construction.module.css';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';

const InConstruction = ({ title }) => {
  useDocumentTitle(title);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.container}
    >

      <div className={styles.iconWrapper}>
        <FiAlertCircle />
      </div>

      <h2 className={styles.title}>
        {title}
      </h2>

      <p className={styles.description}>
        Estamos trabajando arduamente en esta sección.
        Pronto estará disponible con todas las funcionalidades.
      </p>

      <button
        onClick={() => navigate(-1)}
        className={styles.button}
      >

        <FiArrowLeft />

        <span>
          Volver atrás
        </span>

      </button>

    </motion.div>
  );
};

export default InConstruction;