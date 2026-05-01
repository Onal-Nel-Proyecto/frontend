import { useState } from "react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, rememberMe });
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>

        {/* Logo */}
        <span style={styles.logoText}>ona&amp;nel</span>
        <div style={styles.logoSub}>Atelier Management System</div>
        <hr style={styles.divider} />

        {/* Bienvenida */}
        <h1 style={styles.welcomeTitle}>Bienvenido de nuevo</h1>
        <p style={styles.welcomeSub}>
          Ingresa tus credenciales para acceder al dashboard
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              Correo electrónico
            </label>
            <input
              style={styles.input}
              type="email"
              id="email"
              placeholder="ejemplo@onaandnel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Contraseña
            </label>
            <input
              style={styles.input}
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={styles.formOptions}>
            <label style={styles.rememberLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Recordarme
            </label>
            <a href="#" style={styles.forgotLink}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" style={styles.btnLogin}>
            Iniciar sesión
          </button>
        </form>

        <div style={styles.footer}>
          <p>
            ¿No tienes una cuenta?{" "}
            <a href="#" style={styles.footerLink}>
              Contactar a soporte
            </a>
          </p>
        </div>

        <div style={styles.needle}>🪡</div>
      </div>
    </div>
  );
};



export default LoginPage;