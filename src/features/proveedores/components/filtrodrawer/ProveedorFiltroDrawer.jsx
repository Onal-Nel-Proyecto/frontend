import { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import styles from './ProveedorFiltroDrawer.module.css';

const ProveedorFiltroDrawer = ({ isOpen, onClose, filters, setFilters }) => {
  const [local, setLocal] = useState({ estado: filters?.estado || '', suministro: filters?.suministro || '', nombre: filters?.nombre || '' });

  useEffect(() => {
    setLocal({ estado: filters?.estado || '', suministro: filters?.suministro || '', nombre: filters?.nombre || '' });
  }, [filters]);

  const handleClear = () => {
    const empty = { estado: '', suministro: '', nombre: '' };
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
          <input className={styles.input} placeholder="Ej: Materia prima" value={local.suministro} onChange={(e) => setLocal({ ...local, suministro: e.target.value })} />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Nombre</label>
          <input className={styles.input} placeholder="Ej: Proveedor SA" value={local.nombre} onChange={(e) => setLocal({ ...local, nombre: e.target.value })} />
        </div>
      </div>
    </Drawer>
  );
};

export default ProveedorFiltroDrawer;
