import { FiPlus } from 'react-icons/fi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import TablaPedidos from '../../features/pedidos/components/TablaPedidos';
import styles from './pedidos.module.css';

const Pedidos = () => {
  useDocumentTitle('Pedidos');

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.header}>
        <h2 className={styles.title}>Listado de pedidos</h2>
        <button className={styles.btnNuevo}>
          <FiPlus className={styles.btnIcon} />
          Nuevo Pedido
        </button>
      </div>

      {/* Tabla de pedidos recientes */}
      <TablaPedidos />
    </div>
  );
};

export default Pedidos;
