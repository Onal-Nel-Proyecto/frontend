// ================================================================
// ErrorBoundary — Captura errores de renderizado y muestra un
// fallback en lugar de dejar la pantalla en blanco.
// ================================================================

import { Component } from "react";

const defaultFallback = ({ error, resetError }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "40vh",
      padding: "2rem",
      textAlign: "center",
      color: "#555",
    }}
  >
    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
    <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>
      Algo salió mal
    </h2>
    <p style={{ margin: "0 0 0.3rem", color: "#888", fontSize: "0.85rem" }}>
      Ocurrió un error inesperado al mostrar esta sección.
    </p>
    {process.env.NODE_ENV === "development" && (
      <details style={{ margin: "0.5rem 0", fontSize: "0.78rem", color: "#999", maxWidth: "500px" }}>
        <summary>Detalles técnicos</summary>
        <pre style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
          {error?.message}
          {"\n\n"}
          {error?.stack}
        </pre>
      </details>
    )}
    <button
      onClick={resetError}
      style={{
        marginTop: "1rem",
        padding: "0.5rem 1.5rem",
        border: "none",
        borderRadius: "8px",
        background: "#0066cc",
        color: "#fff",
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      Reintentar
    </button>
  </div>
);

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || defaultFallback;
      return (
        <Fallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
