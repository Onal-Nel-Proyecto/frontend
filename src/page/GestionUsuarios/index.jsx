import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import {FiPlus, FiUserCheck, } from 'react-icons/fi';
import { useAuth } from '../../features/auth/hooks/usuAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import UsuarioForm from '../../components/ModalRegistrarUsuario/Usuarioform.jsx';
import TablaUsuarios from '../../features/usuarios/components/tablaUsuarios/TablaUsuarios.jsx';
import { getUsuarios, changeEstadoUsuario, } from '../../features/usuarios/services/user.services.js';

import styles from './gestion-usuarios.module.css';

const GestionUsuarios = () => {

  useDocumentTitle('Gestión de Usuarios');

  const { user } = useAuth();


  const isAdmin =
    user?.rol === 'ADMINISTRADOR';
  // ─── Estados ───────────────────────────────────────────
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [users,               setUsers]               = useState([]);
    const [showForm,            setShowForm]             = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado]  = useState(null);


    const [search, setSearch] = useState(
  () => searchParams.get('search') || ''
);
    const [filters, setFilters] = useState(() => ({
  estado: searchParams.get('estado') || '',
  rol: searchParams.get('rol') || '',
}));

     const loadUsuarios = async () => {
  try {

    console.log('Recargando usuarios...');

    const data = await getUsuarios();

    console.log('Usuarios recibidos:', data);

    setUsers(data);

  } catch (error) {

    console.error(error);

  }
};




  // ─── Cargar usuarios ──────────────────────────────────

 useEffect(() => {

  loadUsuarios();

}, []);
useEffect(() => {
  const params = {};

  if (search) params.search = search;
  if (filters.estado) params.estado = filters.estado;
  if (filters.rol) params.rol = filters.rol;

  setSearchParams(params, {
    replace: true,
  });

}, [search, filters, setSearchParams]);



  // ─── Abrir crear ──────────────────────────────────────

  const openCreate = () => {

    setUsuarioSeleccionado(null);

    setShowForm(true);
  };

  // ─── Abrir editar ─────────────────────────────────────

 const openEdit = (usuario) => {

  setUsuarioSeleccionado(usuario);

  setShowForm(true);

};

  // ─── Cerrar modal ────────────────────────────────────

  const closeForm = () => {

    setShowForm(false);

    setUsuarioSeleccionado(null);
  };

  // ─── Cambiar estado / desbloquear usuario ───────────

  const handleToggleEstado = async (usuario) => {
    if (!usuario) return;

    const targetEstado = usuario.estado === 1 ? 2 : 1;
    const action = targetEstado === 1 ? 'desbloquear' : 'bloquear';

    const confirmed = window.confirm(
      `¿Desea ${action} al usuario ${usuario.nombres} ${usuario.apellidos}?`
    );

    if (!confirmed) return;

    try {
      await changeEstadoUsuario(usuario.id, targetEstado);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, estado: targetEstado } : u
        )
      );
    } catch (error) {
      console.error(error);
    }
  };
 
  // ─── Guard ────────────────────────────────────────────

  if (!user) {

    return (

      <div className={styles.page}>

        <div className={styles.header}>

          <h2 className={styles.title}>
            Gestión de Usuarios
          </h2>

          <p className={styles.subtitle}>
            Validando permisos...
          </p>

        </div>

      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────

  return (

    <div className={styles.page}>

      {/* Header */}

      <div className={styles.header}>

      <div className={styles.headerLeft}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft />
        </button>

        <h2 className={styles.title}>
          Gestión de Usuarios
        </h2>
      </div>

        <button
          className={styles.createButton}
          onClick={openCreate}
        >

          <FiPlus />

          Registrar usuario

        </button>

      </div>

      {/* Warning */}

      {!isAdmin && (

        <div className={styles.warningBox}>
          Solo los administradores pueden editar o eliminar usuarios.
        </div>

      )}

      {/* Tabla */}

      <TablaUsuarios
        usuarios={users}
        isAdmin={isAdmin}
        openEdit={openEdit}
        onToggleEstado={handleToggleEstado}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Nota */}

      <div className={styles.note}>

        <FiUserCheck className={styles.noteIcon} />

        Conectado al backend correctamente.

      </div>

      {/* Modal */}

        <UsuarioForm
           isOpen={showForm}
           onClose={closeForm}
           usuario={usuarioSeleccionado}
           onSuccess={loadUsuarios}
           usuarios={users}
        />

    </div>
  );
};

export default GestionUsuarios;