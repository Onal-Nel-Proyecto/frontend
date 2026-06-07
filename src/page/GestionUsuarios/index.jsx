// ================================================================
// Gestión de Usuarios — Página exclusiva para administradores
// CRUD completo: crear, editar, activar/desactivar, eliminar usuarios
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiShield,
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleUsuarioStatus,
  deleteUsuario,
} from '../../features/auth/services/usuariosService';
import Drawer from '../../components/common/Drawer';
import Alert from '../../components/ui/feedback/Alert';
import styles from './gestion-usuarios.module.css';

// ── Helpers ──────────────────────────────────────────────

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ── Componente principal ────────────────────────────────

const GestionUsuarios = () => {
  useDocumentTitle('Gestión de Usuarios');

  // ── State ──
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = crear, objeto = editar

  // Form
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'EMPLEADO' });
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [saving, setSaving] = useState(false);

  // Confirmación eliminar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Cargar usuarios ──
  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  // ── Stats ──
  const total = usuarios.length;
  const activos = usuarios.filter((u) => u.activo).length;
  const inactivos = total - activos;

  // ── Validación formulario ──
  const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

  const validate = (values, isEdit) => {
    const errs = {};
    
    const nom = values.nombre.trim();
    if (!nom) errs.nombre = 'El nombre es obligatorio';
    else if (nom.length < 3) errs.nombre = 'Mínimo 3 caracteres';
    else if (nom.length > 100) errs.nombre = 'Máximo 100 caracteres';
    else if (!SOLO_LETRAS.test(nom)) errs.nombre = 'Solo letras y espacios, sin números';

    const email = values.email.trim();
    if (!email) {
      errs.email = 'El email es obligatorio';
    } else if (email.length > 100) {
      errs.email = 'Máximo 100 caracteres';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Email inválido';
    }
    
    const pass = values.password;
    if (!isEdit && !pass) {
      errs.password = 'La contraseña es obligatoria';
    } else if (!isEdit && pass && pass.length < 4) {
      errs.password = 'Mínimo 4 caracteres';
    } else if (pass && pass.length > 72) {
      errs.password = 'Máximo 72 caracteres';
    }
    
    if (!values.rol) errs.rol = 'Selecciona un rol';
    return errs;
  };

  // ── Handlers ──
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name) => {
    setFormTouched((prev) => ({ ...prev, [name]: true }));
    // La validación solo se activa en submit
  };

  // ── Abrir drawer: crear ──
  const openCreate = () => {
    setEditTarget(null);
    setForm({ nombre: '', email: '', password: '', rol: 'EMPLEADO' });
    setFormErrors({});
    setFormTouched({});
    setDrawerOpen(true);
  };

  // ── Abrir drawer: editar ──
  const openEdit = (usuario) => {
    setEditTarget(usuario);
    setForm({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '', // No se muestra la contraseña existente
      rol: usuario.rol || 'EMPLEADO',
    });
    setFormErrors({});
    setFormTouched({});
    setDrawerOpen(true);
  };

  // ── Guardar (crear o editar) ──
  const handleSave = async () => {
    const isEdit = !!editTarget;
    const newErrors = validate(form, isEdit);
    setFormErrors(newErrors);
    setFormTouched({ nombre: true, email: true, password: true, rol: true });

    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      if (isEdit) {
        // Editar: solo enviar campos que cambiaron
        const payload = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.password) payload.password = form.password;
        await updateUsuario(editTarget.id, payload);
        showSuccess('Usuario actualizado correctamente');
      } else {
        await createUsuario(form);
        showSuccess('Usuario creado correctamente');
      }
      setDrawerOpen(false);
      setEditTarget(null);
      await loadUsuarios();
    } catch (err) {
      setFormErrors({ general: err.message || 'Error al guardar el usuario' });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo/inactivo ──
  const handleToggle = async (usuario) => {
    try {
      const updated = await toggleUsuarioStatus(usuario.id);
      const nuevoEstado = updated.activo ? 'activado' : 'desactivado';
      showSuccess(`Usuario ${nuevoEstado} correctamente`);
      await loadUsuarios();
    } catch (err) {
      setError(err.message || 'Error al cambiar estado');
    }
  };

  // ── Eliminar ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    setDeleting(true);
    try {
      await deleteUsuario(id);
      showSuccess('Usuario eliminado correctamente');
      await loadUsuarios();
    } catch (err) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  // ── Mostrar mensaje de éxito temporal ──
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Input helper ──
  const hasError = (field) => formTouched[field] && formErrors[field];
  const isEdit = !!editTarget;

  return (
    <div className={styles.page}>
      {/* ══ HEADER ══ */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FiUsers />
          </div>
          <div>
            <h1 className={styles.title}>Gestión de Usuarios</h1>
            <p className={styles.subtitle}>
              Administra los usuarios del sistema. Solo visible para administradores.
            </p>
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <FiUserPlus />
          Nuevo Usuario
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
            <i className="ti ti-x" />
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
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className={styles.cellName}>{u.nombre}</span>
                </td>
                <td>
                  <span className={styles.cellEmail}>{u.email}</span>
                </td>
                <td className={styles.cellRol}>
                  <span className={`${styles.rolBadge} ${u.rol === 'ADMINISTRADOR' ? styles.rolAdmin : styles.rolEmpleado}`}>
                    <i className={`ti ti-${u.rol === 'ADMINISTRADOR' ? 'shield' : 'user'}`} />
                    {u.rol === 'ADMINISTRADOR' ? 'Admin' : 'Empleado'}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${u.activo ? styles.statusActive : styles.statusInactive}`}>
                    <i className={`ti ti-${u.activo ? 'circle-check' : 'circle-x'}`} />
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {fmtDate(u.created_at)}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      title="Editar usuario"
                      onClick={() => openEdit(u)}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionWarn}`}
                      title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                      onClick={() => handleToggle(u)}
                    >
                      {u.activo ? <FiToggleLeft /> : <FiToggleRight />}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionDanger}`}
                      title="Eliminar usuario"
                      onClick={() => setDeleteTarget(u.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usuarios.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <i className="ti ti-users-off" />
            <p>No hay usuarios registrados. Crea el primer usuario.</p>
          </div>
        )}
      </div>

      {/* ══ DRAWER: Crear / Editar ══ */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
        title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
        subtitle={isEdit ? `Editando a ${editTarget.nombre}` : 'Registra un nuevo usuario en el sistema'}
        icon={isEdit ? <FiEdit2 /> : <FiUserPlus />}
        footer={
          <div className={styles.drawerActions}>
            <button
              className={styles.btnSave}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><i className="ti ti-loader ti-spin" /> Guardando…</>
              ) : (
                <><FiCheckCircle /> {isEdit ? 'Actualizar' : 'Crear Usuario'}</>
              )}
            </button>
            <button
              className={styles.btnCancel}
              onClick={() => { setDrawerOpen(false); setEditTarget(null); }}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        }
      >
        <div className={styles.drawerForm}>
          {formErrors.general && (
            <div className={styles.fieldError} style={{ marginBottom: '0.5rem' }}>
              {formErrors.general}
            </div>
          )}

          {/* Nombre */}
          <div className={styles.field}>
            <label className={styles.label}>Nombre completo</label>
            <div className={`${styles.inputWrap} ${hasError('nombre') ? styles.inputWrapErr : ''}`}>
              <FiUser className={styles.inputIcon} />
              <input
                type="text"
                maxLength="100"
                className={styles.input}
                placeholder="Ej: María García"
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                onBlur={() => handleBlur('nombre')}
              />
            </div>
            {hasError('nombre') && <span className={styles.fieldError}>{formErrors.nombre}</span>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label}>Correo electrónico</label>
            <div className={`${styles.inputWrap} ${hasError('email') ? styles.inputWrapErr : ''}`}>
              <FiMail className={styles.inputIcon} />
              <input
                type="email"
                maxLength="100"
                className={styles.input}
                placeholder="ej: usuario@correo.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                onBlur={() => handleBlur('email')}
              />
            </div>
            {hasError('email') && <span className={styles.fieldError}>{formErrors.email}</span>}
          </div>

          {/* Contraseña */}
          <div className={styles.field}>
            <label className={styles.label}>
              {isEdit ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
            </label>
            <div className={`${styles.inputWrap} ${hasError('password') ? styles.inputWrapErr : ''}`}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                maxLength="72"
                className={styles.input}
                placeholder={isEdit ? '•••••••• (dejar vacío)' : 'Mínimo 4 caracteres'}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                onBlur={() => handleBlur('password')}
              />
            </div>
            {hasError('password') && <span className={styles.fieldError}>{formErrors.password}</span>}
          </div>

          {/* Rol */}
          <div className={styles.field}>
            <label className={styles.label}>Rol</label>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleBtn} ${form.rol === 'ADMINISTRADOR' ? styles.roleBtnActive : ''}`}
                onClick={() => setField('rol', 'ADMINISTRADOR')}
              >
                <FiShield className={styles.roleBtnIcon} style={{ color: form.rol === 'ADMINISTRADOR' ? 'var(--accent-violet)' : 'var(--text-muted)' }} />
                <span className={styles.roleBtnLabel}>Administrador</span>
              </button>
              <button
                type="button"
                className={`${styles.roleBtn} ${form.rol === 'EMPLEADO' ? styles.roleBtnActive : ''}`}
                onClick={() => setField('rol', 'EMPLEADO')}
              >
                <FiUser className={styles.roleBtnIcon} style={{ color: form.rol === 'EMPLEADO' ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                <span className={styles.roleBtnLabel}>Empleado</span>
              </button>
            </div>
            {hasError('rol') && <span className={styles.fieldError}>{formErrors.rol}</span>}
          </div>
        </div>
      </Drawer>

      {/* ══ CONFIRMAR ELIMINAR ══ */}
      {deleteTarget && (
        <Alert
          type="confirm"
          title="¿Eliminar usuario?"
          message="Esta acción no se puede deshacer. El usuario será eliminado permanentemente."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ══ LOADING ELIMINACIÓN ══ */}
      {deleting && (
        <div className={styles.loadingBanner}>
          <i className="ti ti-loader ti-spin" />
          Eliminando usuario…
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
