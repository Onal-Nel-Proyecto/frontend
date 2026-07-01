// ================================================================
// TablaUsuarios — Tabla del listado completo de usuarios
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import {
  FiSearch,
  FiMoreVertical,
  FiEdit3,
  FiFilter,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';

import styles from './TablaUsuarios.module.css';
import UsuarioFiltroDrawer from '../filtrodrawer/UsuarioFiltroDrawer';

// ─── Menú de acciones ─────────────────────────────────────
const AccionesMenu = ({
  usuario,
  isAdmin,
  onEdit,
  onToggleEstado,
}) => {

  const [open, setOpen] = useState(false);

  const [menuPos, setMenuPos] = useState({
    top: 0,
    left: 0,
  });
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const getMenuPosition = (buttonRect) => {
    const menuWidth = 180;
    const menuHeight = 120;
    const padding = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = buttonRect.right - menuWidth;
    if (left < padding) left = padding;
    if (left + menuWidth > viewportWidth - padding) {
      left = viewportWidth - menuWidth - padding;
    }

    let top = buttonRect.bottom + 8;
    if (top + menuHeight > viewportHeight - padding) {
      top = Math.max(padding, buttonRect.top - menuHeight - 8);
    }

    return { top, left };
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const handleReposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPos(getMenuPosition(rect));
      }
    };

    handleReposition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleScroll = () => {
      setOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <div
      className={styles.actionsWrapper}
      ref={ref}
    >

      <button
        ref={buttonRef}
        className={styles.actionBtn}
        onClick={() => {
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) {
            setMenuPos(getMenuPosition(rect));
          }
          setOpen((o) => !o);
        }}
      >
        <FiMoreVertical />
      </button>

      {open &&
        createPortal(
          <div
          ref={menuRef}
            className={styles.actionsMenu}
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 999999,
            }}
          >
            <button
              className={styles.actionItem}
              disabled={!isAdmin}
              onClick={() => {
                setOpen(false);
                onEdit(usuario);
              }}
            >
              <FiEdit3 />
              Editar
            </button>

            <button
              className={styles.actionItem}
              disabled={!isAdmin}
              onClick={() => {
                setOpen(false);
                onToggleEstado(usuario);
              }}
            >
              {usuario.estado === 1 ? (
                <FiLock />
              ) : (
                <FiUnlock />
              )}

              {usuario.estado === 1
                ? 'Bloquear'
                : 'Desbloquear'}
            </button>
          </div>,
          document.body
        )}

    </div>
  );
};

// ─── Componente principal ─────────────────────────────────

const TablaUsuarios = ({
  usuarios,
  isAdmin,
  openEdit,
  onToggleEstado,
  search,
  onSearchChange,
  filters,
  setFilters,
}) => {

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilters = Object.values(filters).filter(Boolean).length;

  // ─── Filtro ────────────────────────────────────────────

  const filtered = usuarios.filter((u) => {
    const term = (search || '').toLowerCase();

    const matchesSearch =
      String(u.id ?? '').toLowerCase().includes(term) ||
      `${u.nombres} ${u.apellidos}`.toLowerCase().includes(term) ||
      u.correo?.toLowerCase().includes(term) ||
      u.rol?.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    // Estado filter: 'Activo' means estado === 1
    if (filters?.estado) {
      if (filters.estado === 'Activo' && u.estado !== 1) return false;
      if (filters.estado === 'Inactivo' && u.estado === 1) return false;
    }

    // Rol filter (case-insensitive exact match)
    if (filters.rol) {
      if ((u.rol || '').toLowerCase() !== filters.rol.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <div className={styles.card}>

      {/* Header */}

      <div className={styles.header}>

          <div className={styles.searchBox}>

          <FiSearch className={styles.searchIcon} />

          <input
            type="text"
            placeholder="Buscar usuario..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />

        </div>
        <button
          className={`
            ${styles.filterButton}
            ${
              activeFilters > 0
                ? styles.filterActive
                : ''
            }
          `}
          onClick={() =>
            setIsFilterOpen(true)
          }
        >
          <FiFilter />

          <span>Filtrar</span>

          {activeFilters > 0 && (
            <span
              className={styles.filterCount}
            >
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Tabla */}

      <div className={styles.tableWrapper}>

        <table className={styles.table}>

          <thead>
            <tr>
              <th>ID</th>
              <th>NOMBRE</th>
              <th>CORREO</th>
              <th>TELÉFONO</th>
              <th>ROL</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {filtered.length === 0 ? (

              <tr>
                <td
                  colSpan={7}
                  className={styles.loadingText}
                >
                  No se encontraron usuarios
                </td>
              </tr>

            ) : (

              filtered.map((usuario) => (

                <tr key={usuario.id}>

                  <td className={styles.cellId}>
                    {usuario.id}
                  </td>

                  <td className={styles.cellName}>
                    {usuario.nombres} {usuario.apellidos}
                  </td>

                  <td className={styles.cellEmail}>
                    {usuario.correo}
                  </td>

                  <td>
                    {usuario.telefono}
                  </td>

                  <td>

                    <span className={styles.badge}>
                      {usuario.rol}
                    </span>

                  </td>

                  <td>

                    <span
                      className={
                        usuario.estado === 1
                          ? styles.active
                          : styles.blocked
                      }
                    >
                      {
                        usuario.estado === 1
                          ? 'Activo'
                          : 'Bloqueado'
                      }
                    </span>

                  </td>

                  <td>

                    <AccionesMenu
                      usuario={usuario}
                      isAdmin={isAdmin}
                      onEdit={openEdit}
                      onToggleEstado={onToggleEstado}
                    />

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

        {/* Vista móvil */}

        <div className={styles.mobileList}>

          {filtered.map((usuario) => (

            <div
              key={usuario.id}
              className={styles.mobileCard}
            >

              <div className={styles.mobileHeader}>

                <span className={styles.cellId}>
                  {usuario.id}
                </span>

                <span className={styles.badge}>
                  {usuario.rol}
                </span>

              </div>

              <p className={styles.mobileName}>
                {usuario.nombres} {usuario.apellidos}
              </p>

              <p className={styles.mobileEmail}>
                {usuario.correo}
              </p>

              <div className={styles.mobileFooter}>

                <span
                  className={
                    usuario.estado === 1
                      ? styles.active
                      : styles.blocked
                  }
                >
                  {
                    usuario.estado === 1
                      ? 'Activo'
                      : 'Bloqueado'
                  }
                </span>

                <AccionesMenu
                  usuario={usuario}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onToggleEstado={onToggleEstado}
                />

              </div>

            </div>

          ))}

        </div>

      </div>
        <UsuarioFiltroDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
        />
    </div>
  );
};

export default TablaUsuarios;