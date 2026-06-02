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

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const [generalError, setGeneralError] = useState("");



  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Limpiar error del campo al escribir
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }

    // Limpiar error general al escribir
    if (generalError) setGeneralError("");
  };



  // =========================
  // HANDLE SUBMIT
  // =========================

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setGeneralError("");
    setFieldErrors({});

    try {

      const response = await loginUser(formData);

      console.log(response.data);

      // Guardar datos del usuario en sessionStorage
      sessionStorage.setItem("user", JSON.stringify(response.data));

      // Redireccionar dashboard
      navigate("/dashboard");

    } catch (err) {

      const data = err.response?.data;
      const status = err.response?.status;

      console.log(err);

      // Error de validación (express-validator) → errores por campo
      if (data?.errors) {
        const mapped = {};
        for (const [field, msgs] of Object.entries(data.errors)) {
          mapped[field] = msgs[0]; // primer mensaje de error del campo
        }
        setFieldErrors(mapped);
        return;
      }

      // Error de autenticación / negocio (AppError) → mensaje general
      if (data?.error) {
        setGeneralError(data.error);
        return;
      }

      // Otro error inesperado
      setGeneralError(
        data?.message || "Error al iniciar sesión"
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
        label="email electrónico"
        type="email"
        name="email"
        placeholder="ejemplo@onalnel.com"
        value={formData.email}
        onChange={handleChange}
        error={fieldErrors.email}
      />

      <Input
        label="Contraseña"
        type="password"
        name="pass"
        placeholder="••••••••"
        value={formData.pass}
        onChange={handleChange}
        error={fieldErrors.pass}
      />
{/* 
      <div className={styles.formOptions}>

        <label className={styles.rememberMe}>
          <input type="checkbox" />
          Recordarme
        </label>

        <a href="#" className={styles.forgotpass}>
          ¿Olvidaste tu contraseña?
        </a>

      </div> */}

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

      {
        generalError && (
          <p className={styles.generalError}>
            {generalError}
          </p>
        )
      }

    </form>
  );
};

export default Formulario;