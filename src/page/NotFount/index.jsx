import { Link } from "react-router-dom";
import { FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import styles from "./notFound.module.css";

const NotFound = () => {

  useDocumentTitle("404 - Página no encontrada");

  return (
    <div className={styles.container}>

      <div className={styles.card}>

        <div className={styles.iconContainer}>
          <FaExclamationTriangle className={styles.icon} />
        </div>

        <h1 className={styles.errorCode}>
          404
        </h1>

        <h2 className={styles.title}>
          Página no encontrada
        </h2>

        <p className={styles.description}>
          La página que intentas visitar no existe o fue movida.
          Verifica la URL o regresa al dashboard principal.
        </p>

        <Link
          to="/dashboard"
          className={styles.button}
        >
          <FaArrowLeft />
          Volver al inicio
        </Link>

        <div className={styles.decorativeCircleOne}></div>
        <div className={styles.decorativeCircleTwo}></div>

      </div>

    </div>
  );
};

export default NotFound;