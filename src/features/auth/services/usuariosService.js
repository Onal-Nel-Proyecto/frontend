// ================================================================
// usuariosService — CRUD de usuarios del sistema
// Almacenamiento local (localStorage) con estructura lista para
// migrar a backend real.
// ================================================================

const STORAGE_KEY = 'ona_usuarios';

// ── Helpers ──────────────────────────────────────────────

const genId = () => `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const getUsuariosFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveUsuarios = (usuarios) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
};

// ── Simular encriptación (bcrypt hash simulado) ──────────
// En producción, el backend usa bcrypt real. Aquí simulamos
// un hash para que no se almacene texto plano.

const hashPassword = (password) => {
  // Simulación simple: no es bcrypt real, pero evita texto plano
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  // Prefijo y sal para simular un hash
  const salt = Math.random().toString(36).slice(2, 6);
  return `$2b$10$${salt}${Math.abs(hash).toString(36)}`;
};

const verifyPassword = (password, hash) => {
  // En producción esto lo hace bcrypt.compare
  // Aquí simplemente verificamos que el hash generado coincida
  const newHash = hashPassword(password);
  return newHash === hash;
};

// ── Semilla inicial (usuario admin por defecto) ──────────

const seedIfEmpty = () => {
  const existing = getUsuariosFromStorage();
  if (existing.length === 0) {
    const adminUser = {
      id: genId(),
      nombre: 'Admin',
      email: 'admin@onaNel.com',
      password: hashPassword('admin123'),
      rol: 'ADMINISTRADOR',
      activo: true,
      created_at: new Date().toISOString(),
    };
    saveUsuarios([adminUser]);
  }
};

// ── Exportaciones ────────────────────────────────────────

/** Obtener todos los usuarios */
export const getUsuarios = async () => {
  seedIfEmpty();
  return getUsuariosFromStorage();
};

/** Obtener un usuario por ID */
export const getUsuarioById = async (id) => {
  const usuarios = getUsuariosFromStorage();
  return usuarios.find((u) => u.id === id) || null;
};

/** Crear un nuevo usuario */
export const createUsuario = async (data) => {
  const usuarios = getUsuariosFromStorage();

  // Validar email único
  const existe = usuarios.find(
    (u) => u.email.toLowerCase() === data.email.toLowerCase()
  );
  if (existe) {
    throw new Error('Ya existe un usuario con ese correo electrónico');
  }

  const nuevoUsuario = {
    id: genId(),
    nombre: data.nombre.trim(),
    email: data.email.trim().toLowerCase(),
    password: hashPassword(data.password),
    rol: data.rol || 'EMPLEADO',
    activo: data.activo !== undefined ? data.activo : true,
    created_at: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  saveUsuarios(usuarios);
  return nuevoUsuario;
};

/** Actualizar un usuario (sin cambiar password a menos que se envíe) */
export const updateUsuario = async (id, data) => {
  const usuarios = getUsuariosFromStorage();
  const idx = usuarios.findIndex((u) => u.id === id);

  if (idx === -1) {
    throw new Error('Usuario no encontrado');
  }

  // Validar email único (excluyendo el propio usuario)
  if (data.email) {
    const existe = usuarios.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase() && u.id !== id
    );
    if (existe) {
      throw new Error('Ya existe un usuario con ese correo electrónico');
    }
  }

  const updated = { ...usuarios[idx] };

  if (data.nombre !== undefined) updated.nombre = data.nombre.trim();
  if (data.email !== undefined) updated.email = data.email.trim().toLowerCase();
  if (data.rol !== undefined) updated.rol = data.rol;
  if (data.activo !== undefined) updated.activo = data.activo;
  if (data.password) {
    updated.password = hashPassword(data.password);
  }

  usuarios[idx] = updated;
  saveUsuarios(usuarios);
  return updated;
};

/** Activar/Desactivar un usuario (toggle) */
export const toggleUsuarioStatus = async (id) => {
  const usuarios = getUsuariosFromStorage();
  const idx = usuarios.findIndex((u) => u.id === id);

  if (idx === -1) {
    throw new Error('Usuario no encontrado');
  }

  usuarios[idx].activo = !usuarios[idx].activo;
  saveUsuarios(usuarios);
  return usuarios[idx];
};

/** Eliminar un usuario */
export const deleteUsuario = async (id) => {
  let usuarios = getUsuariosFromStorage();
  const idx = usuarios.findIndex((u) => u.id === id);

  if (idx === -1) {
    throw new Error('Usuario no encontrado');
  }

  usuarios = usuarios.filter((u) => u.id !== id);
  saveUsuarios(usuarios);
  return { status: true, msg: 'Usuario eliminado correctamente' };
};

/** Verificar credenciales (para login simulado) */
export const verificarCredenciales = async (email, password) => {
  const usuarios = getUsuariosFromStorage();
  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!usuario) {
    return { ok: false, error: 'Credenciales inválidas' };
  }

  if (!usuario.activo) {
    return { ok: false, error: 'Usuario desactivado. Contacta al administrador.' };
  }

  if (!verifyPassword(password, usuario.password)) {
    return { ok: false, error: 'Credenciales inválidas' };
  }

  return {
    ok: true,
    user: {
      user_id: usuario.id,
      nombres: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'EMPLEADO',
      activo: usuario.activo,
    },
  };
};
