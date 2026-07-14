// ================================================================
// CategoriaPage — Página de administración de categorías
// Replica el patrón visual de Pedidos page
// ================================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import TablaCategorias from './components/TablaCategorias';
import CategoriaForm from './components/CategoriaForm';
import styles from './categoria.module.css';

const CategoriaPage = () => {
  useDocumentTitle('Categorías');
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);

  const handleNueva = useCallback(() => {
    setEditingCategoria(null);
    setShowForm(true);
  }, []);

  const handleEditar = useCallback((categoria) => {
    setEditingCategoria(categoria);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingCategoria(null);
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
        <h2 className={styles.title}>Categorías</h2>
        <button className={styles.btnNuevo} onClick={handleNueva}>
          <FiPlus className={styles.btnIcon} />
          Nueva Categoría
        </button>
      </div>

      {/* Tabla de categorías */}
      <TablaCategorias onNueva={handleNueva} onEditar={handleEditar} />

      {/* Drawer para nuevo/editar categoría */}
      <CategoriaForm
        isOpen={showForm}
        onClose={handleCloseForm}
        categoria={editingCategoria}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default CategoriaPage;
