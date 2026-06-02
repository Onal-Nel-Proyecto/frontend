import { useEffect, useState } from 'react';
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
    const [users,               setUsers]               = useState([]);
    const [showForm,            setShowForm]             = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado]  = useState(null);

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

  // ─── Eliminar usuario ────────────────────────────────

  const handleDelete = async (usuario) => {
  if (!usuario) return;

  const confirmed = window.confirm(
    `¿Eliminar al usuario ${usuario.nombres} ${usuario.apellidos}?`
  );

  if (!confirmed) return;

  try {
    await changeEstadoUsuario(usuario.id, 2);

  setUsers((prev) =>
    prev.filter((u) => u.id !== usuario.id)
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

        <div>

          <h2 className={styles.title}>
            Gestión de Usuarios
          </h2>

        <p className={styles.subtitle}>
          Sesión iniciada como

          <strong className={styles.userName}>
            {user.nombres} {user.apellidos}
          </strong>

          <span className={styles.roleBadge}>
            {user.rol}
          </span>
        </p>

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
        handleDelete={handleDelete}
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
        />

    </div>
  );
};

export default GestionUsuarios;