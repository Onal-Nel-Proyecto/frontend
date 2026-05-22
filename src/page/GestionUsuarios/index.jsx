import { useMemo, useState } from 'react';
import { FiEdit3, FiTrash2, FiPlus, FiSearch, FiUserCheck } from 'react-icons/fi';
import { useAuth } from '../../features/auth/hooks/usuAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import ModalRegistrarUsuario from '../../components/ModalRegistrarUsuario/ModalRegistrarUsuario';
/*
  Forma de los datos (usuario):
  {
    usuId: string,
    usuNom: string,
    usuApe: string,
    usuTel: string,
    usuCor: string,
    usuPassHash: string, // en el backend se almacena hasheada
    usuRol: 'USUARIO' | 'ADMINISTRADOR',
    usuSupFk: string|null,
    usuEst: string,
    usuFecReg: string (YYYY-MM-DD)
  }

  NOTA: Esta página funciona sólo en frontend por ahora. Elimina el estado local
  y descomenta el ejemplo de `useEffect` cuando quieras obtener los datos desde
  la API del backend.
*/

import styles from './gestion-usuarios.module.css';


const GestionUsuarios = () => {
  useDocumentTitle('Gestión de Usuarios');

  const { user } = useAuth();
  // Estado vacío: los datos vendrán de la API cuando integres el backend
  const [users, setUsers] = useState([]);

  /*
    Ejemplo de integración con API (comentado):
    useEffect(() => {
      // Ejemplo con fetch:
      // fetch('/api/usuarios')
      //   .then(res => res.json())
      //   .then(data => setUsers(data))
      //   .catch(err => console.error(err));
    }, []);
  */
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    usuId: '',
    usuNom: '',
    usuApe: '',
    usuTel: '',
    usuCor: '',
    usuPassHash: '',
    usuRol: 'USUARIO',
    usuSupFk: '',
    usuEst: 'Activo',
  });
  const [editingId, setEditingId] = useState(null);

  // Nota: los usuarios se mantienen en memoria local (estado). Cuando quieras, reemplaza
  // esta lógica por llamadas a la API del backend (fetch/axios) utilizando el mismo payload.

  const openCreate = () => {
    setEditingId(null);
    setForm({
      usuId: '',
      usuNom: '',
      usuApe: '',
      usuTel: '',
      usuCor: '',
      usuPassHash: '',
      usuRol: 'USUARIO',
      usuSupFk: '',
      usuEst: 'Activo',
    });
    setShowModal(true);
  };

  const closeCreate = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.usuId || !form.usuNom || !form.usuApe || !form.usuTel || !form.usuCor || !form.usuPassHash) {
      alert('Completa todos los campos obligatorios.');
      return;
    }

    if (user?.rol !== 'ADMINISTRADOR') {
      alert('Solo administradores pueden registrar usuarios');
      return;
    }

    const payload = {
      ...form,
      usuFecReg: editingId ? form.usuFecReg || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    };

    // Aquí debes llamar a tu API cuando la tengas disponible:
    // - Crear usuario: POST /api/usuarios   body: payload
    // - Actualizar usuario: PUT /api/usuarios/:usuId   body: payload
    // Ejemplo de llamadas a la API (comentadas):
    // if (editingId) {
    //   await fetch(`/api/usuarios/${editingId}`, {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   });
    // } else {
    //   await fetch('/api/usuarios', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   });
    // }

    // Por ahora actualizamos solo el estado local (solo en frontend):
    if (editingId) {
      setUsers((prev) => prev.map((u) => (u.usuId === editingId ? { ...u, ...payload } : u)));
    } else {
      setUsers((prev) => [{ ...payload }, ...prev]);
    }

    setForm({
      usuId: '',
      usuNom: '',
      usuApe: '',
      usuTel: '',
      usuCor: '',
      usuPassHash: '',
      usuRol: 'USUARIO',
      usuSupFk: '',
      usuEst: 'Activo',
    });
    setEditingId(null);
    closeCreate();
  };

  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((currentUser) => {
      const fullName = `${currentUser.usuNom} ${currentUser.usuApe}`.toLowerCase();
      return (
        currentUser.usuId.toLowerCase().includes(term)
        || fullName.includes(term)
        || currentUser.usuCor.toLowerCase().includes(term)
        || currentUser.usuTel.toLowerCase().includes(term)
        || currentUser.usuRol.toLowerCase().includes(term)
        || currentUser.usuEst.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  const handleEdit = (id) => {
    const usuario = users.find((u) => u.usuId === id);
    if (!usuario) return;
    setForm({ ...usuario });
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const usuario = users.find((item) => item.usuId === id);
    if (!usuario) return;
    const confirmDelete = window.confirm(`¿Eliminar al usuario ${usuario.usuNom} ${usuario.usuApe}?`);
    if (!confirmDelete) return;
    // Llamada a la API para eliminar (cuando se integre):
    // await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })

    // Por ahora solo elimino del estado local
    setUsers((prev) => prev.filter((u) => u.usuId !== id));
  };

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Gestión de Usuarios</h2>
          <p className={styles.subtitle}>Validando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Gestión de Usuarios</h2>
        </div>
        <div className={styles.actions}>
          <button className={styles.createButton} onClick={openCreate}>
            <FiPlus /> Registrar usuario
          </button>
        </div>
      </div>

      <div className={styles.controlRow}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por identificación, nombre, correo, teléfono, rol o estado"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className={styles.roleInfo}>
          Usuario actual: <strong>{user.nombres} {user.apellidos}</strong> - Rol: <span>{user.rol}</span>
        </div>
      </div>

      {!isAdmin && (
        <div className={styles.warningBox}>
          Solo los administradores pueden ejecutar acciones de edición o eliminación.
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombre completo</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyRow}>
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              filteredUsers.map((usuario) => (
                <tr key={usuario.usuId}>
                  <td>{usuario.usuId}</td>
                  <td>{usuario.usuNom} {usuario.usuApe}</td>
                  <td>{usuario.usuCor}</td>
                  <td>{usuario.usuTel}</td>
                  <td>{usuario.usuRol}</td>
                  <td>{usuario.usuEst}</td>
                  <td>{usuario.usuFecReg}</td>
                  <td>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEdit(usuario.usuId)}
                      disabled={!isAdmin}
                      title={isAdmin ? 'Editar' : 'Solo administrador'}
                    >
                      <FiEdit3 />
                    </button>
                    <button
                      className={styles.actionButtonDanger}
                      onClick={() => handleDelete(usuario.usuId)}
                      disabled={!isAdmin}
                      title={isAdmin ? 'Eliminar' : 'Solo administrador'}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.note}>
        <FiUserCheck className={styles.noteIcon} />
        Perfecciona esta interfaz antes de conectar al backend. Actualmente los datos solo viven en el frontend.
      </div>

      <ModalRegistrarUsuario
        show={showModal}
        onClose={closeCreate}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default GestionUsuarios;
