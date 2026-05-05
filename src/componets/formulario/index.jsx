import Input from "../Imput";
import Button from "../Button";

const Formulario = () => {
  return (
    <form className="login-form">
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

      <div className="form-options">
        <label>
          <input type="checkbox" />
          Recordarme
        </label>

        <a href="#">¿Olvidaste tu contraseña?</a>
      </div>

      <Button>
        Iniciar Sesión
      </Button>
    </form>
  );
};

export default Formulario;