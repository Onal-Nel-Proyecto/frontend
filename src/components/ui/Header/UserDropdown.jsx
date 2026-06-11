// ================================================================
// UserDropdown — Menú contextual del usuario
// Aparece al hacer clic en el icono FiUser del Header.
// Muestra: avatar, nombre completo, rol del usuario y botón
// "Cerrar sesión". Maneja logout limpio (cookies + AuthContext).
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiLogOut, FiUser, FiHelpCircle, FiSun, FiMoon, FiLock, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import Alert from '../feedback/Alert';
import LoadingOverlay from '../feedback/LoadingOverlay';
import { useAuthContext } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { cambiarPassword } from '../../../api/usuariosService';
import styles from './userDropdown.module.css';

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();

  // Cerrar menú al hacer clic fuera del componente
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ─── Estado del formulario de cambio de contraseña ───
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    passwordActual: '',
    password: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    passwordActual: false,
    password: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formError, setFormError] = useState('');

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const abrirFormulario = () => {
    setOpen(false);
    setShowPasswordForm(true);
    setPasswords({ passwordActual: '', password: '', confirmPassword: '' });
    setFormError('');
  };

  // Bloquear scroll del body cuando el modal de contraseña está abierto
  useEffect(() => {
    if (!showPasswordForm) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPasswordForm]);

  const cerrarFormulario = () => {
    setShowPasswordForm(false);
    setAlert(null);
    setFormError('');
  };

  const handleCambiarPassword = async () => {
    const { passwordActual, password, confirmPassword } = passwords;

    // Validaciones
    if (!passwordActual || !password || !confirmPassword) {
      setFormError('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 6) {
      setFormError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const resp = await cambiarPassword(passwordActual, password);

      if (resp?.status) {
        setAlert({
          type: 'success',
          title: 'Contraseña actualizada',
          message: resp.msg || 'La contraseña se cambió correctamente.',
          onClose: () => cerrarFormulario(),
        });
      } else {
        setAlert({
          type: 'error',
          title: 'Error',
          message: resp?.msg || resp?.error || 'No se pudo cambiar la contraseña.',
          onClose: () => setAlert(null),
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        err.message ||
        'Error de conexión con el servidor';
      setAlert({
        type: 'error',
        title: 'Error',
        message: msg,
        onClose: () => setAlert(null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cerrar sesión: usa AuthContext (backend invalida cookie + limpia estado local)
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* Botón que abre/cierra el menú */}
      <button
        className={`${styles.trigger} ${open ? styles.triggerActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Menú de usuario"
      >
        <FiUser />
      </button>

      {/* Card desplegable */}
      {open && (
        <Card className={styles.dropdown} as="div">
          {user ? (
            <>
              {/* Info del usuario */}
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  <FiUser />
                </div>
                <div>
                  <p className={styles.name}>
                    {user.nombres} {user.apellidos}
                  </p>
                  <p className={styles.role}>
                    {user.rol === 'ADMINISTRADOR' ? 'Administrador' : user.rol}
                  </p>
                </div>
              </div>

              {/* Tema oscuro/claro (solo móvil) */}
              <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}>
                {theme === 'light' ? <FiMoon /> : <FiSun />}
                {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              </button>

              {/* Ayuda (solo móvil) */}
              <button className={styles.helpBtn} title="Ayuda / Help">
                <FiHelpCircle />
                Ayuda / Help
              </button>

              {/* Botón de cambiar contraseña */}
              <button className={styles.passwordBtn} onClick={abrirFormulario}>
                <FiLock />
                Cambiar contraseña
              </button>

              {/* Botón de cerrar sesión */}
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <FiLogOut />
                Cerrar sesión
              </button>
            </>
          ) : (
            <p className={styles.noSession}>Sesión no iniciada</p>
          )}
        </Card>
      )}

      {/* ═══ Modal de cambio de contraseña (portal a body) ═══ */}
      {showPasswordForm && !alert && createPortal(
        <div className={styles.passwordOverlay} onClick={cerrarFormulario}>
          <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.passwordHeader}>
              <div className={styles.passwordTitleRow}>
                <FiLock className={styles.passwordIcon} />
                <h3 className={styles.passwordTitle}>Cambiar contraseña</h3>
              </div>
              <button className={styles.passwordClose} onClick={cerrarFormulario}>
                <FiX />
              </button>
            </div>

            <p className={styles.passwordDesc}>
              Ingresa tu contraseña actual y la nueva contraseña.
            </p>

            <div className={styles.passwordFields}>
              {/* Contraseña actual */}
              <label className={styles.passwordLabel}>Contraseña anterior</label>
              <div className={styles.passwordInputWrap}>
                <input
                  type={showPasswords.passwordActual ? 'text' : 'password'}
                  name="passwordActual"
                  className={styles.passwordInput}
                  placeholder="Ingresa tu contraseña actual"
                  value={passwords.passwordActual}
                  onChange={handlePasswordChange}
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => toggleShowPassword('passwordActual')}
                  tabIndex={-1}
                >
                  {showPasswords.passwordActual ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Nueva contraseña */}
              <label className={styles.passwordLabel}>Nueva contraseña</label>
              <div className={styles.passwordInputWrap}>
                <input
                  type={showPasswords.password ? 'text' : 'password'}
                  name="password"
                  className={styles.passwordInput}
                  placeholder="Ingresa la nueva contraseña"
                  value={passwords.password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => toggleShowPassword('password')}
                  tabIndex={-1}
                >
                  {showPasswords.password ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Confirmar contraseña */}
              <label className={styles.passwordLabel}>Confirmar contraseña</label>
              <div className={styles.passwordInputWrap}>
                <input
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={styles.passwordInput}
                  placeholder="Repite la nueva contraseña"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => toggleShowPassword('confirmPassword')}
                  tabIndex={-1}
                >
                  {showPasswords.confirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {formError && (
              <p className={styles.passwordError}>{formError}</p>
            )}

            <div className={styles.passwordActions}>
              <button className={styles.passwordCancel} onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button
                className={styles.passwordSubmit}
                onClick={handleCambiarPassword}
                disabled={submitting}
              >
                {submitting ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {submitting && <LoadingOverlay title="Cambiando contraseña…" message="Procesando la solicitud" />}
      {alert && createPortal(
        <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose || (() => setAlert(null))} />,
        document.body
      )}
    </div>
  );
};

export default UserDropdown;
