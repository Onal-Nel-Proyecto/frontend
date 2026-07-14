import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import './assets/styles/index.css';

// ─── Handler global de errores no capturados ───
window.addEventListener("error", (event) => {
  console.error("[GlobalError]", event.error?.message || event.message);
  // No mostramos alerta al usuario para no interrumpir,
  // pero queda registrado en la consola.
});

window.addEventListener("unhandledrejection", (event) => {
  console.warn("[UnhandledRejection]", event.reason?.message || event.reason);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);