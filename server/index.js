// ================================================================
// Inventario Server — API REST con persistencia JSON
// Endpoints para: materiales, productos, abastecimientos, proveedores
// ================================================================

import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data.json');

// ════════════════════════════════════════════
//  PERSISTENCIA (archivo JSON)
// ════════════════════════════════════════════

/** Lee y parsea la base de datos JSON */
function readDB() {
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
}
/** Escribe la base de datos al archivo JSON */
function writeDB(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ── Utilidad de paginación ──
function paginate(items, pagina = 1, limite = 15) {
  const total = items.length;
  const paginas_totales = Math.ceil(total / limite) || 1;
  const start = (pagina - 1) * limite;
  const data = items.slice(start, start + limite);
  return { meta: { total, pagina_actual: pagina, paginas_totales, limite }, data };
}

// ── Filtro de materiales ──
function filterMateriales(items, { nombre, estado, tipoMaterial, incluirEliminados = false }) {
  let filtered = [...items];
  // Por defecto, excluir eliminados (Bug #1)
  if (!incluirEliminados) {
    filtered = filtered.filter((m) => m.estado?.toLowerCase() !== 'eliminado');
  }
  if (nombre?.trim()) {
    const q = nombre.toLowerCase();
    filtered = filtered.filter((m) => m.nombre.toLowerCase().includes(q));
  }
  if (estado) {
    filtered = filtered.filter((m) => m.estado === estado);
  }
  if (tipoMaterial?.trim()) {
    filtered = filtered.filter((m) =>
      m.tipoMaterial?.toLowerCase() === tipoMaterial.toLowerCase()
    );
  }
  return filtered;
}

// ── Filtro de productos ──
function filterProductos(items, { nombre, estado, tipoProducto, incluirEliminados = false }) {
  let filtered = [...items];
  // Por defecto, excluir eliminados (Bug #1)
  if (!incluirEliminados) {
    filtered = filtered.filter((p) => p.estado?.toLowerCase() !== 'eliminado');
  }
  if (nombre?.trim()) {
    const q = nombre.toLowerCase();
    filtered = filtered.filter((p) => p.nombre.toLowerCase().includes(q));
  }
  if (estado) {
    filtered = filtered.filter((p) => p.estado === estado);
  }
  if (tipoProducto?.trim()) {
    filtered = filtered.filter((p) =>
      p.tipoPrenda?.toLowerCase() === tipoProducto.toLowerCase()
    );
  }
  return filtered;
}

// ════════════════════════════════════════════
//  EXPRESS APP
// ════════════════════════════════════════════

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ════════════════════════════════════════════
//  MATERIALES
// ════════════════════════════════════════════

// GET /materiales — lista paginada con filtros
app.get('/materiales', (req, res) => {
  const db = readDB();
  const { pagina = 1, limite = 15, nombre, estado, tipoMaterial } = req.query;
  const filtered = filterMateriales(db.materiales, { nombre, estado, tipoMaterial });
  const totalStockFiltrado = filtered.reduce((s, m) => s + Number(m.cantidadDisponible || 0), 0);
  const alertasFiltrado = filtered.filter((m) => Number(m.cantidadDisponible || 0) <= Number(m.umbralMinimo || 0)).length;
  const resumen = {
    total_stock: {
      total: totalStockFiltrado,
      materiales_registrados: db.materiales.length,
    },
    alertas_stock: alertasFiltrado,
  };
  res.json({ ...paginate(filtered, Number(pagina), Number(limite)), resumen });
});

// GET /materiales/:id
app.get('/materiales/:id', (req, res) => {
  const db = readDB();
  const item = db.materiales.find((m) => m.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Material no encontrado' });
  res.json(item);
});

// POST /materiales
app.post('/materiales', (req, res) => {
  const db = readDB();
  const { nombre, tipoMaterial, unidadMedida, umbralMinimo, stock, descripcion } = req.body;
  const id = db.nextId.materiales++;
  const nuevo = {
    id,
    nombre: nombre || '',
    tipoMaterial: tipoMaterial || '',
    unidadMedida: unidadMedida || '',
    cantidadDisponible: Number(stock || 0),
    umbralMinimo: Number(umbralMinimo || 0),
    descripcion: descripcion || '',
    estado: 'disponible',
    referencia: `MAT-${String(id).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.materiales.push(nuevo);
  writeDB(db);
  res.status(201).json(nuevo);
});

// PUT /materiales/:id
app.put('/materiales/:id', (req, res) => {
  const db = readDB();
  const idx = db.materiales.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Material no encontrado' });

  const { nombre, tipoMaterial, unidadMedida, umbralMinimo, stock } = req.body;
  const actualizado = {
    ...db.materiales[idx],
    nombre: nombre ?? db.materiales[idx].nombre,
    tipoMaterial: tipoMaterial ?? db.materiales[idx].tipoMaterial,
    unidadMedida: unidadMedida ?? db.materiales[idx].unidadMedida,
    cantidadDisponible: stock !== undefined ? Number(stock) : db.materiales[idx].cantidadDisponible,
    umbralMinimo: umbralMinimo !== undefined ? Number(umbralMinimo) : db.materiales[idx].umbralMinimo,
    updatedAt: new Date().toISOString(),
  };
  db.materiales[idx] = actualizado;
  writeDB(db);
  res.json(actualizado);
});

// PATCH /materiales/:id/estado
app.patch('/materiales/:id/estado', (req, res) => {
  const db = readDB();
  const idx = db.materiales.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Material no encontrado' });

  const estadoMap = { 1: 'disponible', 2: 'agotado', 3: 'eliminado' };
  const rawEstado = req.body.estado;
  // Normalizar: numérico → string, 'ELIMINADO' → 'eliminado' (Bug #1)
  const estadoStr = estadoMap[rawEstado] || (typeof rawEstado === 'string' ? rawEstado.toLowerCase() : 'disponible');

  db.materiales[idx].estado = estadoStr;
  db.materiales[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.materiales[idx]);
});

// ════════════════════════════════════════════
//  PRODUCTOS
// ════════════════════════════════════════════

// GET /productos — lista paginada con filtros
app.get('/productos', (req, res) => {
  const db = readDB();
  const { pagina = 1, limite = 15, nombre, estado, tipoProducto, categoria } = req.query;
  let filtered = filterProductos(db.productos, { nombre, estado, tipoProducto });
  // Filtro adicional por categoría
  if (categoria?.trim()) {
    filtered = filtered.filter((p) =>
      p.categoria?.toLowerCase() === categoria.toLowerCase()
    );
  }
  const alertasFiltrado = filtered.filter((p) => {
    const stock = Number(p.cantidadDisponible || 0);
    const min = Number(p.umbralMinimo || 0);
    return min > 0 && stock <= min;
  }).length;
  const valorTotalFiltrado = filtered.reduce((s, p) => s + Number(p.precioUnitario || 0) * Number(p.cantidadDisponible || 0), 0);
  const resumen = {
    total_productos: filtered.length,
    alertas_stock: alertasFiltrado,
    valor_total: valorTotalFiltrado,
  };
  res.json({ ...paginate(filtered, Number(pagina), Number(limite)), resumen });
});

// GET /productos/:id
app.get('/productos/:id', (req, res) => {
  const db = readDB();
  const item = db.productos.find((p) => p.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(item);
});

// POST /productos
app.post('/productos', (req, res) => {
  const db = readDB();
  const { nombre, tipoPrenda, categoria, genero, talla, precioUnitario, umbralMinimo, descripcion } = req.body;
  // Normalizar género a código de una letra (F/M/U)
  const generoNormalizado = genero === 'Femenino' ? 'F' : genero === 'Masculino' ? 'M' : genero === 'Unisex' ? 'U' : genero || '';
  const id = db.nextId.productos++;
  const nuevo = {
    id,
    nombre: nombre || '',
    tipoPrenda: tipoPrenda || '',
    categoria: categoria || '',
    genero: generoNormalizado,
    talla: talla || '',
    precioUnitario: Number(precioUnitario || 0),
    cantidadDisponible: 0,
    umbralMinimo: Number(umbralMinimo || 0),
    descripcion: descripcion || '',
    estado: 'disponible',
    referencia: `PROD-${String(id).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.productos.push(nuevo);
  writeDB(db);
  res.status(201).json(nuevo);
});

// PUT /productos/:id
app.put('/productos/:id', (req, res) => {
  const db = readDB();
  const idx = db.productos.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const { nombre, tipoPrenda, categoria, genero, talla, precioUnitario, umbralMinimo } = req.body;
  // Normalizar género a código de una letra (F/M/U)
  const generoNormalizado = genero === 'Femenino' ? 'F' : genero === 'Masculino' ? 'M' : genero === 'Unisex' ? 'U' : genero;
  const actualizado = {
    ...db.productos[idx],
    nombre: nombre ?? db.productos[idx].nombre,
    tipoPrenda: tipoPrenda ?? db.productos[idx].tipoPrenda,
    categoria: categoria !== undefined ? categoria : db.productos[idx].categoria,
    genero: generoNormalizado ?? db.productos[idx].genero,
    talla: talla ?? db.productos[idx].talla,
    precioUnitario: precioUnitario !== undefined ? Number(precioUnitario) : db.productos[idx].precioUnitario,
    umbralMinimo: umbralMinimo !== undefined ? Number(umbralMinimo) : db.productos[idx].umbralMinimo,
    updatedAt: new Date().toISOString(),
  };
  db.productos[idx] = actualizado;
  writeDB(db);
  res.json(actualizado);
});

// PATCH /productos/:id/estado
app.patch('/productos/:id/estado', (req, res) => {
  const db = readDB();
  const idx = db.productos.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const estadoMap = { 1: 'disponible', 2: 'agotado', 3: 'eliminado' };
  const rawEstado = req.body.estado;
  // Normalizar: numérico → string, 'ELIMINADO' → 'eliminado' (Bug #1)
  const estadoStr = estadoMap[rawEstado] || (typeof rawEstado === 'string' ? rawEstado.toLowerCase() : 'disponible');

  db.productos[idx].estado = estadoStr;
  db.productos[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.productos[idx]);
});

// ════════════════════════════════════════════
//  ABASTECIMIENTOS
// ════════════════════════════════════════════

// ── Filtro de abastecimientos ──
function filterAbastecimientos(items, { estado }) {
  let filtered = [...items];
  if (estado) {
    filtered = filtered.filter((a) => a.absEst === estado);
  }
  return filtered;
}

// GET /abastecimientos — lista paginada con filtros
app.get('/abastecimientos', (req, res) => {
  const db = readDB();
  const { pagina = 1, limite = 15, estado } = req.query;
  const filtered = filterAbastecimientos(db.abastecimientos, { estado });
  res.json(paginate(filtered, Number(pagina), Number(limite)));
});

// GET /abastecimientos/:id
app.get('/abastecimientos/:id', (req, res) => {
  const db = readDB();
  const item = db.abastecimientos.find((a) => a.absId === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Abastecimiento no encontrado' });
  res.json(item);
});

// POST /abastecimientos
app.post('/abastecimientos', (req, res) => {
  const db = readDB();
  const { provIdFk, detalles, usuIdFk } = req.body;

  // Buscar nombre del proveedor
  const prov = db.proveedores.find((p) => p.provId === provIdFk);

  const absId = db.nextId.abastecimientos++;
  const totalItems = Array.isArray(detalles) ? detalles.length : 0;
  const costoTotal = Array.isArray(detalles)
    ? detalles.reduce((sum, d) => sum + Number(d.costo || 0) * Number(d.cantidad || 0), 0)
    : 0;

  const nuevo = {
    absId,
    absFec: new Date().toISOString(),
    absEst: 'PENDIENTE',
    absObs: null,
    provIdFk: provIdFk || '',
    proveedor_nombre: prov?.provNom || '—',
    usuIdFk: usuIdFk || '1',
    total_items: totalItems,
    costo_total: costoTotal,
  };

  db.abastecimientos.push(nuevo);
  writeDB(db);
  res.status(201).json(nuevo);
});

// PATCH /abastecimientos/:id/completar
app.patch('/abastecimientos/:id/completar', (req, res) => {
  const db = readDB();
  const idx = db.abastecimientos.findIndex((a) => a.absId === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Abastecimiento no encontrado' });

  db.abastecimientos[idx].absEst = 'COMPLETADO';
  writeDB(db);
  res.json(db.abastecimientos[idx]);
});

// PATCH /abastecimientos/:id/cancelar
app.patch('/abastecimientos/:id/cancelar', (req, res) => {
  const db = readDB();
  const idx = db.abastecimientos.findIndex((a) => a.absId === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Abastecimiento no encontrado' });

  db.abastecimientos[idx].absEst = 'CANCELADO';
  db.abastecimientos[idx].absObs = req.body.observacion || 'Cancelado por el usuario';
  writeDB(db);
  res.json(db.abastecimientos[idx]);
});

// ════════════════════════════════════════════
//  PROVEEDORES
// ════════════════════════════════════════════

// GET /proveedores
app.get('/proveedores', (req, res) => {
  const db = readDB();
  res.json(db.proveedores);
});

// ════════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API de Inventario corriendo en http://localhost:${PORT}`);
  console.log(`   Materiales:   GET/POST /materiales`);
  console.log(`   Productos:    GET/POST /productos`);
  console.log(`   Abastecimientos: GET/POST /abastecimientos`);
  console.log(`   Proveedores:  GET /proveedores`);
});
