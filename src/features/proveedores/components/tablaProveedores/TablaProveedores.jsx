import { useState } from 'react';
import { FiSearch, FiMoreVertical, FiEdit3, FiFilter, FiTrash2 } from 'react-icons/fi';

import styles from './TablaProveedores.module.css';
import ProveedorFiltroDrawer from '../filtrodrawer/ProveedorFiltroDrawer';

const AccionesMenu = ({ proveedor, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.actionsWrapper}>
      <button className={styles.actionBtn} onClick={() => setOpen((o) => !o)}>
        <FiMoreVertical />
      </button>
      {open && (
        <div className={styles.actionsMenu}>
          <button
            className={styles.actionItem}
            onClick={() => {
              setOpen(false);
              onEdit(proveedor);
            }}
          >
            <FiEdit3 />
            Editar
          </button>

          <button
            className={styles.actionItem}
            onClick={() => {
              setOpen(false);
              onDelete(proveedor);
            }}
          >
            <FiTrash2 />
            Deshabilitar
          </button>
        </div>
      )}
    </div>
  );
};

const TablaProveedores = ({ proveedores = [], openEdit, handleDelete }) => {
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ estado: '', suministro: '', nombre: '' });

  const activeFilters = Object.values(filters).filter(Boolean).length;

  const filtered = (proveedores || []).filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      String(p.prov_id ?? '').toLowerCase().includes(term) ||
      (p.prov_nombre || '').toLowerCase().includes(term) ||
      (p.prov_correo || '').toLowerCase().includes(term) ||
      (p.prov_telefono || '').toLowerCase().includes(term);
    if (!matchesSearch) return false;

    if (filters.estado) {
      if (filters.estado === 'ACTIVO' && (p.pro_estado || '').toUpperCase() !== 'ACTIVO') return false;
      if (filters.estado === 'INACTIVO' && (p.pro_estado || '').toUpperCase() !== 'INACTIVO') return false;
    }

    if (filters.suministro) {
      const suministros = (p.prov_suministro || []).map((s) => s.toLowerCase());
      if (!suministros.some((s) => s.includes(filters.suministro.toLowerCase()))) return false;
    }

    if (filters.nombre) {
      if (!p.prov_nombre?.toLowerCase().includes(filters.nombre.toLowerCase())) return false;
    }

    return true;
  });

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar proveedor..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={`${styles.filterButton} ${activeFilters > 0 ? styles.filterActive : ''}`}
          onClick={() => setIsFilterOpen(true)}
        >
          <FiFilter />
          <span>Filtrar</span>
          {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>NOMBRE</th>
              <th>SUMINISTROS</th>
              <th>CORREO</th>
              <th>TELÉFONO</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.loadingText}>
                  No se encontraron proveedores
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.prov_id}>
                  <td className={styles.cellId}>{p.prov_id}</td>
                  <td className={styles.cellName}>{p.prov_nombre}</td>
                  <td>{(p.prov_suministro || []).join(', ')}</td>
                  <td>{p.prov_correo}</td>
                  <td>{p.prov_telefono}</td>
                  <td>
                    <span className={p.pro_estado === 'ACTIVO' ? styles.active : styles.blocked}>{p.pro_estado}</span>
                  </td>
                  <td>
                    <AccionesMenu proveedor={p} onEdit={openEdit} onDelete={handleDelete} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className={styles.mobileList}>
          {filtered.map((p) => (
            <div key={p.prov_id} className={styles.mobileCard}>
              <div className={styles.mobileHeader}>
                <span className={styles.cellId}>{p.prov_id}</span>
                <span className={styles.badge}>{p.pro_estado}</span>
              </div>

              <p className={styles.mobileName}>{p.prov_nombre}</p>
              <p className={styles.mobileEmail}>{p.prov_correo}</p>

              <div className={styles.mobileFooter}>
                <AccionesMenu proveedor={p} onEdit={openEdit} onDelete={handleDelete} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProveedorFiltroDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} />
    </div>
  );
};

export default TablaProveedores;
