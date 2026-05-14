/**
 * Obtiene el usuario almacenado en sessionStorage (logueado vía login o useAuth).
 * @returns {{ user_id, nombres, apellidos, rol } | null}
 */
export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Retorna true si el usuario logueado tiene rol de administrador.
 */
export const isAdmin = () => {
  const user = getStoredUser();
  return user?.rol === "ADMINISTRADOR";
};
