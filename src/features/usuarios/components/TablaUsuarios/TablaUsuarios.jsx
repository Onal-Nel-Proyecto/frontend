// ================================================================
// TablaUsuarios — Tabla del listado completo de usuarios
// ================================================================

import { useState, useRef, useEffect } from 'react';

import {
  FiSearch,
  FiMoreVertical,
  FiEdit3,
  FiFilter,
  FiTrash2,
} from 'react-icons/fi';

import styles from './TablaUsuarios.module.css';

// ─── Menú de acciones ─────────────────────────────────────

const AccionesMenu = ({
  usuario,
  isAdmin,
  onEdit,
  onDelete,
}) => {

  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  useEffect(() => {

    const handleClick = (e) => {

      if (
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClick
      );
    };

  }, []);

  return (
    <div
      className={styles.actionsWrapper}
      ref={ref}
    >

      <button
        className={styles.actionBtn}
        onClick={() => setOpen((o) => !o)}
      >
        <FiMoreVertical />
      </button>

      {open && (
        <div className={styles.actionsMenu}>

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
              onDelete(usuario);
            }}
          >
            <FiTrash2 />
            Eliminar
          </button>

        </div>
      )}

    </div>
  );
};

// ─── Componente principal ─────────────────────────────────

const TablaUsuarios = ({
  usuarios,
  isAdmin,
  openEdit,
  handleDelete,
}) => {

  const [search, setSearch] = useState('');

  // ─── Filtro ────────────────────────────────────────────

  const filtered = usuarios.filter((u) => {

    const term = search.toLowerCase();

    return (
     String(u.id ?? '').toLowerCase().includes(term) ||
      `${u.nombres} ${u.apellidos}`.toLowerCase().includes(term) ||
      u.correo?.toLowerCase().includes(term) ||
      u.rol?.toLowerCase().includes(term)
    );
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
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
          <FiFilter className={styles.filterIcon} />

        </div>

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

                  <td>
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
                      onDelete={handleDelete}
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
                  onDelete={handleDelete}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default TablaUsuarios;