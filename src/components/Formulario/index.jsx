import styles from './fmr.module.css';
import Input from "../Imput";
import Button from "../Button";
import { useNavigate } from "react-router-dom";  // ← 1. agrega este import

const Formulario = () => {
  const navigate = useNavigate();  // ← 2. agrega esto

  const handleSubmit = (e) => {  // ← 3. agrega esta función
    e.preventDefault();
    navigate("/clients");
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>  {/* ← 4. agrega onSubmit */}
      <Input
        label="Correo electrónico"
        type="email"
        placeholder="ejemplo@onaandnel.com"
      />
      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
      />
      <div className={styles.formOptions}>
        <label className={styles.rememberMe}>
          <input type="checkbox" />
          Recordarme
        </label>
        <a href="#" className={styles.forgotPassword}>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
      <Button type="submit" tipoDeEstilo={true} active={false}>
        Iniciar Sesión
      </Button>
    </form>
  );
};

export default Formulario;