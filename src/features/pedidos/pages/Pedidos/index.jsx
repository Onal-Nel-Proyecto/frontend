import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import TablaPedidos from '../../components/TablaPedidos';
import PedidoForm from '../../components/PedidoForm';
import styles from './pedidos.module.css';

const Pedidos = () => {
  useDocumentTitle('Pedidos');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.header}>
        <h2 className={styles.title}>Listado de pedidos</h2>
        <button className={styles.btnNuevo} onClick={() => setShowForm(true)}>
          <FiPlus className={styles.btnIcon} />
          Nuevo Pedido
        </button>
      </div>

      {/* Tabla de pedidos recientes */}
      <TablaPedidos />

      {/* Drawer para nuevo pedido */}
      <PedidoForm isOpen={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
};

export default Pedidos;
