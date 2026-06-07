// ================================================================
// socketService — Conexión Socket.IO para notificaciones en tiempo real
// Carga socket.io-client de forma diferida (dynamic import) para no
// inflar el bundle inicial con ~50KB que solo se usan en notificaciones.
// ================================================================

let socket = null;

/**
 * Obtener (o crear) la conexión Socket.IO
 * Usa la misma URL base que las peticiones HTTP (VITE_API_URL)
 * La primera llamada importa dinámicamente socket.io-client.
 */
export const getSocket = async () => {
  if (socket?.connected) return socket;

  const { io } = await import("socket.io-client");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // Extraer el origen (protocolo + host) de la URL de la API
  const urlObj = new URL(apiUrl);
  const serverUrl = `${urlObj.protocol}//${urlObj.host}`;

  socket = io(serverUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 15000,
  });

  socket.on("connect", () => {
    console.log("[SOCKET] Conectado al servidor de notificaciones");
  });

  socket.on("disconnect", (reason) => {
    console.log("[SOCKET] Desconectado:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[SOCKET] Error de conexión:", err.message);
  });

  return socket;
};

/**
 * Desconectar socket manualmente
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
