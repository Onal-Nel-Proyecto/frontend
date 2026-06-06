// ================================================================
// UserDropdown — Menú contextual del usuario
// Aparece al hacer clic en el icono FiUser del Header.
// Muestra: avatar, nombre completo, rol del usuario y botón
// "Cerrar sesión". Maneja logout limpio (cookies + AuthContext).
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiUser, FiHelpCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import { useAuthContext } from '../../../context/AuthContext';
import styles from './userDropdown.module.css';

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

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

              {/* Ayuda (solo móvil) */}
              <button className={styles.helpBtn} title="Ayuda / Help">
                <FiHelpCircle />
                Ayuda / Help
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
    </div>
  );
};

export default UserDropdown;
