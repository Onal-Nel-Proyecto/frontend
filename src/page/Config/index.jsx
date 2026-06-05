// ================================================================
// Configuración — Página de administración del sistema
// Agrupa módulos de configuración (Categorías, Copia de seguridad,
// Medidas) como cards en filas verticales. Al hacer clic en una
// card redirige a la página correspondiente.
// Solo visible para usuarios con rol ADMINISTRADOR.
// ================================================================

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiHardDrive,
  FiArrowRight
} from 'react-icons/fi';
import { TfiRulerPencil } from "react-icons/tfi";
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './config.module.css';

// ─── Opciones de configuración ───
// Cada objeto: id único, título, descripción, icono, color y ruta de navegación.
const opciones = [
  {
    id: 'categorias',
    titulo: 'Categorías',
    descripcion: 'Administra las categorías de productos del sistema.',
    icono: <FiGrid />,
    color: '#3b82f6',
    path: '/config/categorias',
  },
  {
    id: 'medidas',
    titulo: 'Medidas',
    descripcion: 'Administra las medidas disponibles para los productos.',
    icono: <TfiRulerPencil  />,
    color: '#f59e0b',
    path: '/config/medidas',
  },
];

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const Config = () => {
  useDocumentTitle('Configuración');
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Header de la página */}
      <div className={styles.header}>
        <h2 className={styles.title}>Configuración</h2>
        <p className={styles.subtitle}>
          Administra los parámetros generales del sistema, como categorías,
          medidas y copias de seguridad.
        </p>
      </div>

      {/* Lista de cards en filas (cada card ocupa todo el ancho) */}
      <div className={styles.list}>
        {opciones.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={styles.card}
            onClick={() => navigate(item.path)}
          >
            {/* Icono con fondo semitransparente del color del módulo */}
            <div
              className={styles.iconWrapper}
              style={{ background: `${item.color}18`, color: item.color }}
            >
              {item.icono}
            </div>

            {/* Título + descripción */}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{item.titulo}</h3>
              <p className={styles.cardDesc}>{item.descripcion}</p>
            </div>

            {/* Flecha indicadora → */}
            <div className={styles.arrow}>
              <FiArrowRight />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default Config;
