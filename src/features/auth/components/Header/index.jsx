import styles from "./hdr.module.css";

const Header = () => {
  return (
    <>
      <div className={styles.logoSection}>

        <span className={styles.logoText}>
          ona&nel
        </span>

        <div className={styles.logoSubtext}>
          Atelier Management System
        </div>

      </div>

      <div className={styles.welcomeHeader}>

        <h1>Bienvenido de nuevo</h1>

        <p>
          Ingresa tus credenciales para acceder al dashboard
        </p>

      </div>
    </>
  );
};

export default Header;