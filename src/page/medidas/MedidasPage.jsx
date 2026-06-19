// ================================================================
// MedidasPage — Página de administración de medidas
// Replica el patrón visual de CategoriaPage / Pedidos page
// ================================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import TablaMedidas from './components/TablaMedidas';
import MedidaForm from './components/MedidaForm';
import styles from './medidas.module.css';

const MedidasPage = () => {
  useDocumentTitle('Medidas');
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editingMedida, setEditingMedida] = useState(null);

  const handleNueva = useCallback(() => {
    setEditingMedida(null);
    setShowForm(true);
  }, []);

  const handleEditar = useCallback((medida) => {
    setEditingMedida(medida);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingMedida(null);
  }, []);

  const handleSuccess = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className={styles.page}>
      {/* Botón volver a configuración */}
      <button className={styles.backBtn} onClick={() => navigate('/config')}>
        <FiArrowLeft />
        Volver a configuración
      </button>

      {/* Encabezado */}
      <div className={styles.header}>
        <h2 className={styles.title}>Medidas</h2>
        <button className={styles.btnNuevo} onClick={handleNueva}>
          <FiPlus className={styles.btnIcon} />
          Nueva Medida
        </button>
      </div>

      {/* Tabla de medidas */}
      <TablaMedidas onNueva={handleNueva} onEditar={handleEditar} />

      {/* Drawer para nuevo/editar medida */}
      <MedidaForm
        isOpen={showForm}
        onClose={handleCloseForm}
        medida={editingMedida}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default MedidasPage;
