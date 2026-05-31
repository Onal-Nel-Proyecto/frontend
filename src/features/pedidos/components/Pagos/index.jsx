import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import styles from '../../pages/PedidoSeleccionado/pedido_seleccionado.module.css';

const Pagos = () => {
  const { pedido } = useOutletContext();
  const navigate = useNavigate();
  const estaTerminado = pedido.estado?.toUpperCase() === 'TERMINADO';

  return (
    <div className={styles.placeholder}>
      <p style={{ marginBottom: '0.75rem' }}>
        {estaTerminado
          ? 'Este pedido está terminado. Gestiona su cobro desde la sección Ventas.'
          : 'Los pagos se gestionan cuando el pedido esté en estado Terminado, desde la sección Ventas.'}
      </p>
      <button
        onClick={() => navigate('/ventas')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '10px',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <i className="ti ti-arrow-right" />
        Ir a Ventas
      </button>
    </div>
  );
};

export default Pagos;
