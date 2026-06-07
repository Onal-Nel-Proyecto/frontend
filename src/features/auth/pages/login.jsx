import Footer from "../components/Footer";
import Formulario from "../components/Formulario";
import Header from "../components/Header";
import styles from "./login.module.css";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";

const Login = () => {
  useDocumentTitle("Login");
  return (
    <div className={styles.loginContainer}>

      {/* Blobs decorativos flotantes */}
      <div className={styles.blobLila} />
      <div className={styles.blobGold} />

      <div className={styles.loginCard}>

        <Header />

        <Formulario />

        <Footer />

      </div>
    </div>
  );
};

export default Login;