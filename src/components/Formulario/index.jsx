import styles from './fmr.module.css';
import Input from "../Imput";
import Button from "../Button";

const Formulario = () => {
  return (
    <form className={styles.loginForm}>
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
      <Button>Iniciar Sesión</Button>
    </form>
  );
};

export default Formulario;