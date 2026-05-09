import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./fmr.module.css";


import { loginUser } from "../../services/authService";
import Input from "../../../../components/common/Input";
import Button from "../../../../components/common/Button";

const Formulario = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    pass: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  // =========================
  // HANDLE SUBMIT
  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault();
    console.log(formData);
    setLoading(true);

    setError("");

    try {

      const data = await loginUser(formData);

      console.log(data);

      // Redireccionar dashboard
      navigate("/dashboard");

    } catch (error) {

      console.log(error);

      setError(
        error.response?.data?.message ||
        "Error al iniciar sesión"
      );

    } finally {

      setLoading(false);
    }
  };



  return (

    <form
      className={styles.loginForm}
      onSubmit={handleSubmit}
    >

      <Input
        label="Correo electrónico"
        type="email"
        name="email"
        placeholder="ejemplo@onaandnel.com"
        value={formData.email}
        onChange={handleChange}
      />

      <Input
        label="Contraseña"
        type="password"
        name="pass"
        placeholder="••••••••"
        value={formData.pass}
        onChange={handleChange}
      />
{/* 
      <div className={styles.formOptions}>

        <label className={styles.rememberMe}>
          <input type="checkbox" />
          Recordarme
        </label>

        <a href="#" className={styles.forgotPassword}>
          ¿Olvidaste tu contraseña?
        </a>

      </div> */}


      {
        error && (
          <p className={styles.errorMessage}>
            {error}
          </p>
        )
      }


      <Button
        type="submit"
        disabled={loading}
        tipoDeEstilo={true}
        active={false}
      >
        {
          loading
            ? "Ingresando..."
            : "Iniciar Sesión"
        }
      </Button>

    </form>
  );
};

export default Formulario;