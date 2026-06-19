import { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import styles from './UsuarioFiltroDrawer.module.css';

const UsuarioFiltroDrawer = ({ isOpen, onClose, filters, setFilters }) => {
  const [local, setLocal] = useState({
    estado: filters?.estado || '',
    rol: filters?.rol || '',
  });

  useEffect(() => {
    setLocal({
      estado: filters?.estado || '',
      rol: filters?.rol || '',
    });
  }, [filters]);

  const handleClear = () => {
    const empty = { estado: '', rol: '' };
    setLocal(empty);
    setFilters(empty);
  };

  const handleApply = () => {
    setFilters(local);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrar usuarios"
      subtitle="Personaliza tu búsqueda"
      icon={<FiFilter />}
      footer={
        <>
          <button className={styles.clearBtn} onClick={handleClear}>
            Limpiar
          </button>

          <button className={styles.applyBtn} onClick={handleApply}>
            Aplicar filtros
          </button>
        </>
      }
    >
      <div className={styles.container}>

        {/* Estado */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Estado</label>

          <select
            className={styles.select}
            value={local.estado}
            onChange={(e) => setLocal({ ...local, estado: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Rol */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Rol</label>

          <select
            className={styles.select}
            value={local.rol}
            onChange={(e) => setLocal({ ...local, rol: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="Administrador">Administrador</option>
            <option value="Usuario">Usuario</option>
          </select>
        </div>


      </div>
    </Drawer>
  );
};

export default UsuarioFiltroDrawer;
