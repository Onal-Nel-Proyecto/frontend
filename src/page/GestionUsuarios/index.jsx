// ================================================================
// Gestión de Usuarios — API real con backend
// Diseño dark theme (develop)
// ================================================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiUserCheck, FiUsers, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../features/auth/hooks/usuAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import UsuarioForm from '../../components/ModalRegistrarUsuario/Usuarioform.jsx';
import TablaUsuarios from '../../features/usuarios/components/tablaUsuarios/TablaUsuarios.jsx';
import { getUsuarios, changeEstadoUsuario } from '../../features/usuarios/services/user.services.js';

import styles from './gestion-usuarios.module.css';

const GestionUsuarios = () => {
  useDocumentTitle('Gestión de Usuarios');

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.rol === 'ADMINISTRADOR';

  // ─── Estados ───────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [filters, setFilters] = useState(() => ({
    estado: searchParams.get('estado') || '',
    rol: searchParams.get('rol') || '',
  }));

  // ─── Cargar usuarios ──────────────────────────────────
  const loadUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsuarios();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Sincronizar search params
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (filters.estado) params.estado = filters.estado;
    if (filters.rol) params.rol = filters.rol;
    setSearchParams(params, { replace: true });
  }, [search, filters, setSearchParams]);

  // ─── Stats ────────────────────────────────────────────
  const total = users.length;
  const activos = users.filter((u) => u.estado === 1).length;
  const inactivos = total - activos;

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

  // ─── Cambiar estado ────────────────────────────────
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
      showTemporalSuccess(`Usuario ${action}do correctamente`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // ─── Mostrar mensaje temporal ─────────────────────────
  const showTemporalSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─── Render principal ─────────────────────────────────

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><FiUsers /></div>
            <div>
              <h1 className={styles.title}>Gestión de Usuarios</h1>
              <p className={styles.subtitle}>Validando permisos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ══ HEADER ══ */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className={styles.headerIcon}>
            <FiUsers />
          </div>
          <div>
            <h1 className={styles.title}>Gestión de Usuarios</h1>
            <p className={styles.subtitle}>
              Administra los usuarios del sistema.
            </p>
          </div>
        </div>
        <button className={styles.createButton} onClick={openCreate}>
          <FiPlus />
          Registrar usuario
        </button>
      </div>

      {/* ══ STATS ══ */}
      <div className={styles.stats}>
        <div className={styles.statCard} style={{ animationDelay: '0s' }}>
          <div className={`${styles.statIcon} ${styles.statIconViolet}`}>
            <FiUsers />
          </div>
          <div>
            <p className={styles.statValue}>{total}</p>
            <p className={styles.statLabel}>Total Usuarios</p>
            <p className={styles.statSub}>registrados en el sistema</p>
          </div>
        </div>
        <div className={styles.statCard} style={{ animationDelay: '0.08s' }}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <FiCheckCircle />
          </div>
          <div>
            <p className={styles.statValue}>{activos}</p>
            <p className={styles.statLabel}>Activos</p>
            <p className={styles.statSub}>pueden iniciar sesión</p>
          </div>
        </div>
        <div className={styles.statCard} style={{ animationDelay: '0.16s' }}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <FiAlertCircle />
          </div>
          <div>
            <p className={styles.statValue}>{inactivos}</p>
            <p className={styles.statLabel}>Inactivos</p>
            <p className={styles.statSub}>no pueden iniciar sesión</p>
          </div>
        </div>
      </div>

      {/* ══ MENSAJES ══ */}
      {successMsg && (
        <div className={styles.successAlert}>
          <FiCheckCircle />
          {successMsg}
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <FiAlertCircle />
          {error}
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0 0.25rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.loadingBanner}>
          <i className="ti ti-loader ti-spin" />
          Cargando usuarios…
        </div>
      )}

      {/* ══ TABLA ══ */}
      <TablaUsuarios
        usuarios={users}
        isAdmin={isAdmin}
        openEdit={openEdit}
        onToggleEstado={handleToggleEstado}
        search={search}
        onSearchChange={(value) => {
          console.log('SET SEARCH:', value);
          setSearch(value);
        }}
        filters={filters}
        setFilters={setFilters}
      />

      {/* ══ NOTA ══ */}
      <div className={styles.note}>
        <FiUserCheck className={styles.noteIcon} />
        Conectado al backend correctamente.
      </div>

      {/* ══ MODAL ══ */}
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
