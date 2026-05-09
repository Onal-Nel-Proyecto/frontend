import Footer from "../components/Footer";
import Formulario from "../components/Formulario";
import Header from "../components/Header";
import styles from "./login.module.css";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";

const Login = () => {
  useDocumentTitle("Login");
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>

        <Header />

        <Formulario />

        <Footer />

        <div className={styles.decorativeNeedle}>
          🪡
        </div>

      </div>
    </div>
  );
};

export default Login;