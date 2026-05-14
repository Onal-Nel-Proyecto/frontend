// ================================================================
// Configuración — Página de administración del sistema
// Agrupa módulos de configuración (Categorías, Copia de seguridad,
// Medidas) como cards en filas verticales. Al hacer clic en una
// card se muestra un placeholder InConstruction.
// Solo visible para usuarios con rol ADMINISTRADOR.
// ================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiGrid,
  FiHardDrive,
  FiArrowLeft,
  FiArrowRight
} from 'react-icons/fi';
import { TfiRulerPencil } from "react-icons/tfi";
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import InConstruction from '../../components/ui/feedback/InConstruction/InConstruction';
import styles from './config.module.css';

// ─── Opciones de configuración ───
// Cada objeto: id único, título, descripción, icono y color para el icono.
const opciones = [
  {
    id: 'categorias',
    titulo: 'Categorías',
    descripcion: 'Administra las categorías de productos del sistema.',
    icono: <FiGrid />,
    color: '#3b82f6',
  },
  {
    id: 'copia-seguridad',
    titulo: 'Copia de seguridad',
    descripcion: 'Gestiona las copias de seguridad de la base de datos.',
    icono: <FiHardDrive />,
    color: '#8b5cf6',
  },
  {
    id: 'medidas',
    titulo: 'Medidas',
    descripcion: 'Administra las medidas disponibles para los productos.',
    icono: <TfiRulerPencil  />,
    color: '#f59e0b',
  },
];

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

const Config = () => {
  useDocumentTitle('Configuración');
  // selected = { id, titulo, ... } cuando el usuario hace clic en una card
  const [selected, setSelected] = useState(null);

  // Si hay un módulo seleccionado → mostrar InConstruction con botón volver
  if (selected) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setSelected(null)}>
            <FiArrowLeft />
            Volver a configuración
          </button>
        </div>
        <InConstruction title={selected.titulo} />
      </div>
    );
  }

  // Vista principal: lista de módulos de configuración
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
            onClick={() => setSelected(item)}
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
