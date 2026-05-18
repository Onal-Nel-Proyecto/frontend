// ================================================================
// Pagos — Sub-página de pagos de un pedido
// Placeholder.
// ================================================================

import { useOutletContext } from 'react-router-dom';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const Pagos = () => {
  const { pedido } = useOutletContext();
  const pagos = pedido.pagos || [];

  if (pagos.length === 0) {
    return <div className={styles.placeholder}>Este pedido no tiene pagos registrados</div>;
  }

  return <div className={styles.placeholder}>Contenido pendiente — Pagos</div>;
};

export default Pagos;
