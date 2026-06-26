// ================================================================
// OrdenesProduccion — Página de listado de órdenes de producción
// Reutiliza TablaPedidos y PedidoForm con origen=PRODUCCION
// ================================================================

import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import TablaPedidos from '../../components/TablaPedidos';
import PedidoForm from '../../components/PedidoForm';
import styles from './ordenes-produccion.module.css';

const OrdenesProduccion = () => {
  useDocumentTitle('Órdenes de Producción');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Órdenes de Producción</h2>
          <p className={styles.subtitle}>
            Gestiona las órdenes de producción para inventario
          </p>
        </div>
        <button className={styles.btnNuevo} onClick={() => setShowForm(true)}>
          <FiPlus className={styles.btnIcon} />
          Nueva Orden
        </button>
      </div>

      {/* Tabla de órdenes de producción */}
      <TablaPedidos origen="PRODUCCION" />

      {/* Drawer para nueva orden */}
      <PedidoForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        origen="PRODUCCION"
      />
    </div>
  );
};

export default OrdenesProduccion;
