import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import {
  FiUsers,
  FiUserCheck,
  FiArrowRight
} from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';

import styles from './gestion-personal.module.css';
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { isAdmin } from '../../utils/session';

const GestionPersonal = () => {
  useDocumentTitle("Gestión Personal");
  const navigate = useNavigate();

  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("userUpdate", refresh);
    return () => window.removeEventListener("userUpdate", refresh);
  }, []);

  const options = [
    {
      title: 'Gestionar Clientes',
      icon: <FiUsers />,
      path: '/gestion-clientes',
      iconClass: styles.blueIcon
    },
  ];

  // Solo admin puede ver "Gestionar Usuarios"
  if (isAdmin()) {
    options.push({
      title: 'Gestionar Usuarios',
      icon: <FiUserCheck />,
      path: '/gestion-usuarios',
      iconClass: styles.violetIcon
    });
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>

        <h2 className={styles.title}>
          Gestión Personal
        </h2>

        <p className={styles.subtitle}>
          Administra la base de datos de clientes y usuarios del sistema
        </p>

      </div>

      <div className={styles.grid}>

        {
          options.map((option, index) => (

            <motion.button
              key={option.title}

              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}

              transition={{
                delay: index * 0.1
              }}

              onClick={() => navigate(option.path)}

              className={styles.card}
            >

              <div className={`${styles.iconWrapper} ${option.iconClass}`}>
                {option.icon}
              </div>

              <h3 className={styles.cardTitle}>
                {option.title}
              </h3>

              <p className={styles.cardDescription}>
                Accede a la configuración avanzada y listados detallados de este módulo.
              </p>

              <div className={styles.action}>

                <span>
                  Configurar
                </span>

                <FiArrowRight />

              </div>

            </motion.button>

          ))
        }

      </div>

    </div>
  );
};

export default GestionPersonal;