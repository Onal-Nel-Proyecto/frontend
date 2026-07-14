import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiMoreVertical, FiEdit3, FiFilter, FiTrash2 } from 'react-icons/fi';

import styles from './TablaProveedores.module.css';
import ProveedorFiltroDrawer from '../filtrodrawer/ProveedorFiltroDrawer';

const AccionesMenu = ({ proveedor, onEdit, onDelete, menuAbierto, setMenuAbierto }) => {
  const wrapperRef = useRef(null);
  const isOpen = menuAbierto === proveedor.prov_id;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {

      const clickedInsideAnyWrapper = event.target.closest(
        `.${styles.actionsWrapper}`
      );

      if (!clickedInsideAnyWrapper) {
        setMenuAbierto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setMenuAbierto]);

  return (
    <div className={styles.actionsWrapper} ref={wrapperRef}>
     <button
        className={styles.actionBtn}
        onClick={() =>
          setMenuAbierto(
            menuAbierto === proveedor.prov_id
              ? null
              : proveedor.prov_id
          )
        }
      >
        <FiMoreVertical />
      </button>
      {isOpen && (
        <div className={styles.actionsMenu}>
          <button
            className={styles.actionItem}
            onClick={() => {
              setMenuAbierto(null);
              onEdit(proveedor);
            }}
          >
            <FiEdit3 />
            Editar
          </button>

          {proveedor.pro_estado === 'ACTIVO' && (
            <button
              className={styles.actionItem}
              onClick={() => {
                setMenuAbierto(null);
                onDelete(proveedor);
              }}
            >
              <FiTrash2 />
              Deshabilitar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TablaProveedores = ({
  proveedores = [],
  search = '',
  onSearchChange,
  filters = {
    estado: '',
    suministro: '',
    tipoDocumento: '',
  },
  setFilters,
  openEdit,
  handleDelete,
  loading,
}) => {
  console.log('PROVEEDORES TABLA:', proveedores);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const filtered = (proveedores || []).filter((p) => {

  // ===== FILTROS =====

  const matchEstado =
    !filters.estado ||
    p.pro_estado === filters.estado;

  const matchTipoDocumento =
    !filters.tipoDocumento ||
    p.prov_tip_ident === filters.tipoDocumento;

  const filtroSuministro = (filters.suministro || '').toLowerCase().trim();

  const matchSuministro =
    !filtroSuministro ||
    (p.prov_suministro || []).some((item) =>
      String(item).toLowerCase().includes(filtroSuministro)
    );

  // ===== BÚSQUEDA =====

  const textoBusqueda = (search || "")
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]/g, "");

  const nombre = (p.prov_nombre || "")
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]/g, "");

  const documento = (p.prov_num_ident || "")
    .toString()
    .toLowerCase()
    .replace(/[.\-\s]/g, "");

  const matchSearch =
    textoBusqueda === "" ||
    nombre.includes(textoBusqueda) ||
    documento.includes(textoBusqueda);

  // ===== RESULTADO FINAL =====

  return (
    matchEstado &&
    matchTipoDocumento &&
    matchSuministro &&
    matchSearch
  );

});

  console.log('TOTAL PROVEEDORES:', proveedores.length);
console.log('FILTERED:', filtered.length);
console.log('FILTROS:', filters);

if (proveedores.length > 0) {
  console.log('PRIMER PROVEEDOR:', proveedores[0]);
  console.log('ESTADO:', proveedores[0].pro_estado);
  console.log('SUMINISTRO:', proveedores[0].prov_suministro);
}

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            className={styles.searchInput}
            value={search}
            maxLength={300}
            onChange={(e) => onSearchChange?.(e.target.value)}
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
              <th>DOCUMENTO</th>
              <th>NOMBRE</th>
              <th>SUMINISTROS</th>
              <th>CORREO</th>
              <th>TELÉFONO</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.loadingText}>
                  Cargando proveedores...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.loadingText}>
                  No se encontraron proveedores
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.prov_id}>
                  <td className={styles.cellDocumento}>
                    <div className={styles.tipoDocumento}>
                      {p.prov_tip_ident}
                    </div>
                    <div>{p.prov_num_ident}</div>
                  </td>
                  <td className={styles.cellName}>{p.prov_nombre}</td>
                  <td>{(p.prov_suministro || []).join(', ')}</td>
                  <td>{p.prov_correo}</td>
                  <td>{p.prov_telefono}</td>
                  <td>
                    <span className={p.pro_estado === 'ACTIVO' ? styles.active : styles.blocked}>{p.pro_estado}</span>
                  </td>
                  <td>
                    <AccionesMenu proveedor={p}  onEdit={openEdit}  onDelete={handleDelete}    menuAbierto={menuAbierto} setMenuAbierto={setMenuAbierto}/>
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
                <div className={styles.cellDocumento}>
                  <div className={styles.tipoDocumento}>
                    {p.prov_tip_ident}
                  </div>

                  <div>{p.prov_num_ident}</div>
                </div>
                <span className={styles.badge}>{p.pro_estado}</span>
              </div>

              <p className={styles.mobileName}>{p.prov_nombre}</p>
              <p className={styles.mobileEmail}>{p.prov_correo}</p>

              <div className={styles.mobileFooter}>
                <AccionesMenu
                  proveedor={p}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  menuAbierto={menuAbierto}
                  setMenuAbierto={setMenuAbierto}
                />
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
