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

  // Leer usuario desde sessionStorage
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

  // Cerrar dropdown al hacer clic fuera
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

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // aunque falle, limpiamos sesión local
    }
    sessionStorage.removeItem("user");
    window.dispatchEvent(new Event("userUpdate"));
    navigate("/login");
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Menú de usuario"
      >
        <FiUser />
      </button>

      {open && (
        <Card className={styles.dropdown} as="div">
          {user ? (
            <>
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

              <button
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
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
