// ================================================================
// UserDropdown — Menú contextual del usuario
// Aparece al hacer clic en el icono FiUser del Header.
// Muestra: avatar, nombre completo, rol del usuario y botón
// "Cerrar sesión". Maneja logout limpio (cookies + sessionStorage).
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import { logoutUser } from '../../../features/auth/services/authService';
import styles from './userDropdown.module.css';

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Leer usuario desde sessionStorage y escuchar actualizaciones
  const syncUser = () => {
    try {
      const raw = sessionStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("userUpdate", syncUser);
    return () => window.removeEventListener("userUpdate", syncUser);
  }, []);

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

  // Cerrar sesión: llama al backend, limpia sessionStorage y redirige
  const handleLogout = async () => {
    try {
      await logoutUser();          // limpia cookies en el backend
    } catch {
      /* incluso si falla el backend, limpiamos sesión local */
    }
    sessionStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdate"));
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
