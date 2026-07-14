// ================================================================
// session.js — Utilidades para leer la sesión del usuario
// Los datos se almacenan en sessionStorage al hacer login
// (o al verificar sesión con /auth/perfil).
// ================================================================

/**
 * Obtiene el objeto usuario guardado en sessionStorage.
 * @returns {{ user_id, nombres, apellidos, rol } | null}
 */
export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Catch silencioso intencional: JSON corrupto → null
    return null;
  }
};

/**
 * Retorna true si el usuario logueado tiene rol ADMINISTRADOR.
 */
export const isAdmin = () => {
  const user = getStoredUser();
  return user?.rol === "ADMINISTRADOR";
};
