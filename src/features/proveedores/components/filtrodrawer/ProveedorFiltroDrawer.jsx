import { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import styles from './ProveedorFiltroDrawer.module.css';

const ProveedorFiltroDrawer = ({ isOpen, onClose, filters, setFilters }) => {
  const [local, setLocal] = useState({ estado: filters?.estado || '', suministro: filters?.suministro || '' });

  useEffect(() => {
    setLocal({ estado: filters?.estado || '', suministro: filters?.suministro || '' });
  }, [filters]);

  const handleClear = () => {
    const empty = { estado: '', suministro: '' };
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
      title="Filtrar proveedores"
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
        <div className={styles.filterGroup}>
          <label className={styles.label}>Estado</label>
          <select className={styles.select} value={local.estado} onChange={(e) => setLocal({ ...local, estado: e.target.value })}>
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

          <div className={styles.filterGroup}>
          <label className={styles.label}>Suministro</label>
          <select className={styles.select} value={local.suministro} onChange={(e) => setLocal({ ...local, suministro: e.target.value })}>
            <option value="">Todos</option>
            <option value="Materia prima">Materia prima</option>
            <option value="Envases">Envases</option>
            <option value="Accesorios">Accesorios</option>
          </select>
        </div>
      </div>
    </Drawer>
  );
};

export default ProveedorFiltroDrawer;
