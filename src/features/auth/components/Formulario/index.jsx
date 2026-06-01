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
    
    const errs = {};
    const email = formData.email.trim();
    if (!email) errs.email = 'El correo es obligatorio';
    else if (email.length > 100) errs.email = 'Máximo 100 caracteres';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Correo electrónico inválido';
    
    if (!formData.pass) errs.pass = 'La contraseña es obligatoria';
    else if (formData.pass.length < 4) errs.pass = 'Mínimo 4 caracteres';
    
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    
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
        label="Correo electrónico"
        type="email"
        name="email"
        placeholder="ejemplo@onaandnel.com"
        value={formData.email}
        onChange={handleChange}
        error={fieldErrors.email}
        maxLength={100}
      />

      <Input
        label="Contraseña"
        type="password"
        name="pass"
        placeholder="••••••••"
        value={formData.pass}
        onChange={handleChange}
        error={fieldErrors.pass}
        maxLength={72}
      />

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