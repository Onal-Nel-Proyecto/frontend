// Servicio de usuarios preparado para sustituir por llamadas reales a la API más adelante.
// Actualmente usa localStorage y devuelve Promises para simular llamadas asíncronas.

const STORAGE_KEY = 'app_users_v1';

const seedUsers = [
  {
    usuId: 'USR001',
    usuNom: 'Ana',
    usuApe: 'Pérez',
    usuTel: '+57 300 123 4567',
    usuCor: 'ana.perez@empresa.com',
    usuPassHash: '********',
    usuRol: 'ADMINISTRADOR',
    usuSupFk: '',
    usuEst: 'Activo',
    usuFecReg: '2026-05-10',
  },
  {
    usuId: 'USR002',
    usuNom: 'Carlos',
    usuApe: 'Gómez',
    usuTel: '+57 311 987 6543',
    usuCor: 'carlos.gomez@empresa.com',
    usuPassHash: '********',
    usuRol: 'USUARIO',
    usuSupFk: 'USR001',
    usuEst: 'Activo',
    usuFecReg: '2026-05-12',
  },
];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('usersService.readStorage parse error', err);
    return null;
  }
}

function writeStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('usersService.writeStorage error', err);
  }
}

const usersService = {
  getUsers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        let list = readStorage();
        if (!list) {
          list = seedUsers;
          writeStorage(list);
        }
        resolve([...list]);
      }, 120);
    });
  },

  createUser(user) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const list = readStorage() || [...seedUsers];
        const newUser = { ...user };
        list.unshift(newUser);
        writeStorage(list);
        resolve(newUser);
      }, 140);
    });
  },

  updateUser(id, patch) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const list = readStorage() || [...seedUsers];
        const updated = list.map((u) => (u.usuId === id ? { ...u, ...patch } : u));
        writeStorage(updated);
        resolve(updated.find((u) => u.usuId === id) || null);
      }, 140);
    });
  },

  deleteUser(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const list = readStorage() || [...seedUsers];
        const filtered = list.filter((u) => u.usuId !== id);
        writeStorage(filtered);
        resolve(true);
      }, 120);
    });
  },

  // Helper to reset storage during development
  _reset() {
    writeStorage(seedUsers);
  },
};

export default usersService;
