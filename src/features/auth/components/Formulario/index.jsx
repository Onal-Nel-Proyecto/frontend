import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

import styles from "./fmr.module.css";

import { useAuthContext } from "../../../../context/AuthContext";
import Input from "../../../../components/common/Input";
import Button from "../../../../components/common/Button";

const Formulario = () => {

  const navigate = useNavigate();
  const { login } = useAuthContext();

  const [formData, setFormData] = useState({
    email: "",
    pass: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);



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
      // El backend setea la httpOnly cookie;
      // AuthContext.login guarda los datos del usuario en contexto + caché
      await login(formData);
      navigate("/dashboard");

    } catch (err) {

      const data = err.response?.data;
      const status = err.response?.status;

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
        id="login-email"
        placeholder="ejemplo@onaandnel.com"
        value={formData.email}
        onChange={handleChange}
        error={fieldErrors.email}
        maxLength={100}
      />

      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <label htmlFor="login-pass" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Contraseña</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            name="pass"
            id="login-pass"
            placeholder="••••••••"
            value={formData.pass}
            onChange={handleChange}
            maxLength={72}
            style={{
              width: '100%',
              padding: '0.85rem 2.8rem 0.85rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${fieldErrors.pass ? '#f87171' : 'var(--border-glass)'}`,
              background: fieldErrors.pass ? 'rgba(248, 113, 113, 0.06)' : 'var(--bg-glass)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-violet)';
              e.target.style.boxShadow = '0 0 0 4px var(--accent-violet-subtle), 0 0 20px rgba(167, 139, 250, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = fieldErrors.pass ? '#f87171' : 'var(--border-glass)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              padding: '4px',
            }}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {fieldErrors.pass && (
          <span style={{ display: 'block', marginTop: '0.4rem', fontSize: 'var(--text-xs)', color: '#f87171' }}>{fieldErrors.pass}</span>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        tipoDeEstilo={true}
        active={false}
        style={{ opacity: loading ? 0.6 : 1 }}
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