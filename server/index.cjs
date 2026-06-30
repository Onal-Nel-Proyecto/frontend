// ================================================================
// Mock Server Completo — Todos los endpoints que consume el frontend
// Ejecutar: node server/index.cjs
// ================================================================

const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

const PORT = process.env.PORT || 3000

// ════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════

const paginate = (items, pagina = 1, limite = 15) => {
  const p = Math.max(1, parseInt(pagina, 10) || 1)
  const l = Math.max(1, parseInt(limite, 10) || 15)
  const total = items.length
  const totalPaginas = Math.max(1, Math.ceil(total / l))
  const inicio = (p - 1) * l
  return {
    data: items.slice(inicio, inicio + l),
    paginacion: { pagina: p, limite: l, total, totalPaginas, pagina_actual: p },
  }
}

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════

const USUARIO_DEMO = {
  user_id: 1,
  user_nombres: 'Admin',
  user_apellidos: 'Principal',
  user_email: 'admin@ona-nel.com',
  user_rol: 'admin',
}

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ status: false, msg: 'Email y contraseña requeridos' })
  res.json({ status: true, msg: 'Inicio de sesión exitoso', token: 'mock-token-ona-nel-12345', data: { ...USUARIO_DEMO } })
})

app.post('/auth/refresh', (_req, res) => res.json({ status: true, token: 'mock-token-refreshed' }))
app.post('/auth/logout', (_req, res) => res.json({ status: true, msg: 'Sesión cerrada' }))
app.get('/auth/perfil', (_req, res) => res.json({ status: true, data: { ...USUARIO_DEMO } }))

// ════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════

app.get('/dashboard/resumen', (_req, res) => res.json({
  status: true,
  data: {
    ventas_hoy: { total: 3, monto: 450000 },
    ventas_semana: { total: 18, monto: 2850000 },
    ventas_mes: { total: 72, monto: 12500000 },
    pedidos_pendientes: 8,
    productos_bajo_stock: 3,
    alertas_activas: 5,
    total_clientes: 45,
    total_proveedores: 12,
  }
}))

app.get('/dashboard/pedidos', (_req, res) => res.json({
  status: true,
  data: [
    { id: 1, cliente: 'Cliente Demo', total: 150000, estado: 'PENDIENTE', fecha: '2026-06-28' },
    { id: 2, cliente: 'Cliente Demo 2', total: 230000, estado: 'COMPLETADO', fecha: '2026-06-27' },
    { id: 3, cliente: 'Cliente Demo 3', total: 85000, estado: 'PENDIENTE', fecha: '2026-06-26' },
  ]
}))

// ════════════════════════════════════════════
//  ALERTAS
// ════════════════════════════════════════════

const ALERTAS = [
  { id: 1, tipo: 'WARNING', categoria: 'STOCK', titulo: 'Stock bajo', mensaje: 'Cremallera Metálica Dorada tiene stock crítico', fecha: '2026-06-28', estado: 'ACTIVO' },
  { id: 2, tipo: 'INFO', categoria: 'SISTEMA', titulo: 'Actualización disponible', mensaje: 'Nueva versión del sistema disponible', fecha: '2026-06-27', estado: 'ACTIVO' },
  { id: 3, tipo: 'ERROR', categoria: 'VENTA', titulo: 'Venta rechazada', mensaje: 'La venta #1234 fue rechazada por falta de stock', fecha: '2026-06-26', estado: 'ACTIVO' },
]

app.get('/alertas', (req, res) => {
  const { pagina = 1, limite = 15 } = req.query
  res.json(paginate(ALERTAS, pagina, limite))
})

// ════════════════════════════════════════════
//  CLIENTES
// ════════════════════════════════════════════

const CLIENTES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  cli_nombre: `Cliente Demo ${i + 1}`,
  cli_documento: `1000000${String(i + 1).padStart(2, '0')}`,
  cli_telefono: `300${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
  cli_correo: `cliente${i + 1}@email.com`,
  cli_direccion: `Calle ${i + 1} #${i + 1}-${i + 1}`,
  estado: 'ACTIVO',
}))

app.get('/clientes', (req, res) => {
  const { pagina = 1, limite = 15, busqueda } = req.query
  let items = [...CLIENTES]
  if (busqueda) items = items.filter((c) => c.cli_nombre.toLowerCase().includes(busqueda.toLowerCase()))
  res.json(paginate(items, pagina, limite))
})

app.post('/clientes', (req, res) => {
  const nuevo = { id: CLIENTES.length + 1, ...req.body, estado: 'ACTIVO' }
  CLIENTES.push(nuevo)
  res.status(201).json({ status: true, msg: 'Cliente creado', data: nuevo })
})

// ════════════════════════════════════════════
//  VENTAS
// ════════════════════════════════════════════

const VENTAS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  cliente_nombre: `Cliente Demo ${(i % 5) + 1}`,
  total: Math.floor(Math.random() * 500000) + 50000,
  estado: randomItem(['PENDIENTE', 'COMPLETADO', 'ANULADO']),
  fecha_registro: new Date(2026, 5, 28 - i).toISOString().split('T')[0],
  metodo_pago: randomItem(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']),
  detalles: [
    { producto: 'Camisa Oxford Manga Larga', cantidad: 2, precio: 85000 },
    { producto: 'Pantalón Clásico Tiro Alto', cantidad: 1, precio: 95000 },
  ],
}))

app.get('/ventas', (req, res) => {
  const { pagina = 1, limite = 15, fecha_registro } = req.query
  let items = [...VENTAS]
  if (fecha_registro) items = items.filter((v) => v.fecha_registro === fecha_registro)
  res.json(paginate(items, pagina, limite))
})

app.get('/ventas/:id', (req, res) => {
  const v = VENTAS.find((x) => x.id === parseInt(req.params.id))
  if (!v) return res.status(404).json({ status: false, msg: 'Venta no encontrada' })
  res.json({ data: v })
})

app.post('/ventas', (req, res) => {
  const nueva = { id: VENTAS.length + 1, ...req.body, fecha_registro: new Date().toISOString().split('T')[0], estado: 'PENDIENTE' }
  VENTAS.unshift(nueva)
  res.status(201).json({ status: true, msg: 'Venta creada', data: nueva })
})

app.patch('/ventas/:id/estado', (req, res) => {
  const idx = VENTAS.findIndex((v) => v.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Venta no encontrada' })
  VENTAS[idx].estado = req.body.estado
  res.json({ status: true, msg: 'Estado actualizado' })
})

app.delete('/ventas/:id', (req, res) => {
  const idx = VENTAS.findIndex((v) => v.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Venta no encontrada' })
  VENTAS[idx].estado = 'ANULADO'
  res.json({ status: true, msg: 'Venta anulada' })
})

app.get('/ventas/reportes/mensual', (req, res) => res.json({ status: true, data: { total: 12500000, cantidad: 72, mes: 6, anio: 2026 } }))
app.get('/ventas/reportes/periodo', (req, res) => res.json({ status: true, data: { total: 3200000, cantidad: 18 } }))

// ════════════════════════════════════════════
//  PEDIDOS
// ════════════════════════════════════════════

const PEDIDOS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  pedido_cliente_nombre: `Cliente Pedido ${i + 1}`,
  pedido_total: Math.floor(Math.random() * 800000) + 100000,
  pedido_estado: randomItem(['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']),
  pedido_fecha: new Date(2026, 5, Math.min(28, i + 1)).toISOString().split('T')[0],
}))

app.get('/pedidos', (req, res) => {
  const { pagina = 1, limite = 15 } = req.query
  res.json(paginate(PEDIDOS, pagina, limite))
})

app.get('/pedidos/dash', (_req, res) => res.json({ status: true, data: PEDIDOS.slice(0, 5) }))

// ════════════════════════════════════════════
//  MATERIALES
// ════════════════════════════════════════════

let MATERIALES = [
  { id: 1, nombre: 'Tela Algodón Premium', tipoMaterial: 'TELA', unidadMedida: 'Metros (mts)', descripcion: 'Algodón egipcio 100%', cantidadDisponible: 150, umbralMinimo: 20, estado: 'DISPONIBLE' },
  { id: 2, nombre: 'Hilo Poliéster Negro', tipoMaterial: 'HILO', unidadMedida: 'Rollos', descripcion: 'Hilo resistente color negro', cantidadDisponible: 80, umbralMinimo: 10, estado: 'DISPONIBLE' },
  { id: 3, nombre: 'Cremallera Metálica Dorada', tipoMaterial: 'CREMALLERA', unidadMedida: 'Paquetes', descripcion: 'Cremallera dorada 20cm', cantidadDisponible: 5, umbralMinimo: 15, estado: 'AGOTADO' },
  { id: 4, nombre: 'Botones Camisa Blanca', tipoMaterial: 'BOTON', unidadMedida: 'Paquetes', descripcion: 'Botones blancos 12mm', cantidadDisponible: 200, umbralMinimo: 30, estado: 'DISPONIBLE' },
  { id: 5, nombre: 'Elástico Cintura 2cm', tipoMaterial: 'ELASTICO', unidadMedida: 'Metros (mts)', descripcion: 'Elástico blanco 2cm', cantidadDisponible: 60, umbralMinimo: 10, estado: 'DISPONIBLE' },
]

app.get('/materiales', (req, res) => {
  let items = [...MATERIALES]
  const { nombre, estado, tipoMaterial, pagina = 1, limite = 15 } = req.query
  if (nombre) items = items.filter((m) => m.nombre.toLowerCase().includes(nombre.toLowerCase()))
  if (estado) items = items.filter((m) => m.estado === estado)
  if (tipoMaterial) items = items.filter((m) => m.tipoMaterial === tipoMaterial)
  const result = paginate(items, pagina, limite)
  const totalStock = items.reduce((s, m) => s + m.cantidadDisponible, 0)
  res.json({ ...result, resumen: { total_stock: { total: totalStock, materiales_registrados: items.length }, alertas_stock: items.filter((m) => m.cantidadDisponible <= m.umbralMinimo).length } })
})

app.get('/materiales/:id', (req, res) => {
  const item = MATERIALES.find((m) => m.id === parseInt(req.params.id))
  if (!item) return res.status(404).json({ status: false, msg: 'Material no encontrado' })
  res.json({ data: item })
})

app.post('/materiales', (req, res) => {
  const nuevo = { id: MATERIALES.length + 1, ...req.body, cantidadDisponible: req.body.cantidadDisponible ?? 0, estado: 'DISPONIBLE' }
  MATERIALES.push(nuevo)
  res.status(201).json({ status: true, msg: 'Material creado', data: nuevo })
})

app.put('/materiales/:id', (req, res) => {
  const idx = MATERIALES.findIndex((m) => m.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Material no encontrado' })
  MATERIALES[idx] = { ...MATERIALES[idx], ...req.body, id: MATERIALES[idx].id }
  res.json({ status: true, msg: 'Material actualizado', data: MATERIALES[idx] })
})

app.patch('/materiales/:id/estado', (req, res) => {
  const idx = MATERIALES.findIndex((m) => m.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Material no encontrado' })
  MATERIALES[idx].estado = req.body.estado
  res.json({ status: true, msg: 'Estado actualizado' })
})

// ════════════════════════════════════════════
//  PRODUCTOS
// ════════════════════════════════════════════

let PRODUCTOS = [
  { id: 1, nombre: 'Camisa Oxford Manga Larga', referencia: 'PR00000055', descripcion: 'Camisa formal manga larga', precioUnitario: 85000, cantidadDisponible: 43, umbralMinimo: 20, tipoPrenda: 'CAMISA', categoria: 'Formal', genero: 'Masculino', talla: 'M', tipoProducto: 'INVENTARIO', estado: 1 },
  { id: 2, nombre: 'Pantalón Clásico Tiro Alto', referencia: 'PR00000048', descripcion: 'Pantalón formal tiro alto', precioUnitario: 95000, cantidadDisponible: 30, umbralMinimo: 15, tipoPrenda: 'PANTALON', categoria: 'Formal', genero: 'Femenino', talla: 'S', tipoProducto: 'INVENTARIO', estado: 1 },
  { id: 3, nombre: 'Vestido Noche Seda', referencia: 'PR00000062', descripcion: 'Vestido largo de seda', precioUnitario: 180000, cantidadDisponible: 12, umbralMinimo: 5, tipoPrenda: 'VESTIDO', categoria: 'Fiesta', genero: 'Femenino', talla: 'M', tipoProducto: 'INVENTARIO', estado: 1 },
  { id: 4, nombre: 'Blusa Seda Estampada', referencia: 'PR00000033', descripcion: 'Blusa estampada manga corta', precioUnitario: 65000, cantidadDisponible: 55, umbralMinimo: 10, tipoPrenda: 'BLUSA', categoria: 'Casual', genero: 'Femenino', talla: 'L', tipoProducto: 'INVENTARIO', estado: 1 },
  { id: 5, nombre: 'Camisa escolar manga corta', referencia: 'PR00000048', descripcion: null, precioUnitario: 22000, cantidadDisponible: 43, umbralMinimo: 80, tipoPrenda: 'UNIFORME ESCOLAR', categoria: 'Uniformes', genero: null, talla: null, tipoProducto: 'PERSONALIZADO', estado: 1, categoria_id: 6 },
]

app.get('/productos', (req, res) => {
  let items = [...PRODUCTOS]
  const { nombre, estado, categoria, pagina = 1, limite = 15 } = req.query
  if (nombre) items = items.filter((p) => p.nombre.toLowerCase().includes(nombre.toLowerCase()))
  if (estado) items = items.filter((p) => String(p.estado) === String(estado))
  if (categoria) items = items.filter((p) => p.categoria?.toLowerCase().includes(categoria.toLowerCase()))
  res.json(paginate(items, pagina, limite))
})

app.get('/productos/:id', (req, res) => {
  const item = PRODUCTOS.find((p) => p.id === parseInt(req.params.id))
  if (!item) return res.status(404).json({ status: false, msg: 'Producto no encontrado' })
  res.json({ data: item })
})

app.post('/productos', (req, res) => {
  if (!req.body.tipoProducto) return res.status(400).json({ status: false, msg: 'Errores de validación', errors: { tipoProducto: ['El tipo de producto es requerido', 'El tipo debe ser PERSONALIZADO o INVENTARIO'] } })
  const nuevo = { id: PRODUCTOS.length + 1, ...req.body, cantidadDisponible: req.body.cantidadDisponible ?? 0, estado: 1, referencia: `PR${String(PRODUCTOS.length + 1).padStart(8, '0')}` }
  PRODUCTOS.push(nuevo)
  res.status(201).json({ status: true, msg: 'Producto creado', data: nuevo })
})

app.put('/productos/:id', (req, res) => {
  const idx = PRODUCTOS.findIndex((p) => p.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Producto no encontrado' })
  if (!req.body.tipoProducto) return res.status(400).json({ status: false, msg: 'Errores de validación', errors: { tipoProducto: ['El tipo de producto es requerido', 'El tipo debe ser PERSONALIZADO o INVENTARIO'] } })
  PRODUCTOS[idx] = { ...PRODUCTOS[idx], ...req.body, id: PRODUCTOS[idx].id }
  res.json({ status: true, msg: 'Producto actualizado', data: PRODUCTOS[idx] })
})

app.patch('/productos/:id/estado', (req, res) => {
  const idx = PRODUCTOS.findIndex((p) => p.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Producto no encontrado' })
  PRODUCTOS[idx].estado = req.body.estado
  res.json({ status: true, msg: 'Estado actualizado' })
})

// ════════════════════════════════════════════
//  PROVEEDORES
// ════════════════════════════════════════════

const PROVEEDORES = [
  { prov_id: 1, prov_nombre: 'Textiles del Valle', prov_telefono: '3001234567', prov_correo: 'ventas@textilesvalle.com' },
  { prov_id: 2, prov_nombre: 'Hilos y Más SAS', prov_telefono: '3007654321', prov_correo: 'info@hilosymas.com' },
  { prov_id: 3, prov_nombre: 'Insumos de Moda', prov_telefono: '3012345678', prov_correo: 'contacto@insumosmoda.com' },
]

app.get('/proveedores', (_req, res) => res.json({ data: PROVEEDORES }))

// ════════════════════════════════════════════
//  ABASTECIMIENTOS
// ════════════════════════════════════════════

let ABASTECIMIENTOS = [
  { absId: 1, absFec: '2026-06-15', absEst: 'COMPLETADO', provIdFk: 1, proveedor_nombre: 'Textiles del Valle', costo_total: 450000, total_items: 2, detalles: [{ detAbsTip: 'MATERIAL', detAbsRefId: '1', detAbsRefNombre: 'Tela Algodón Premium', detAbsCant: 50, detAbsCos: 5000 }, { detAbsTip: 'MATERIAL', detAbsRefId: '2', detAbsRefNombre: 'Hilo Poliéster Negro', detAbsCant: 20, detAbsCos: 2000 }] },
  { absId: 2, absFec: '2026-07-01', absEst: 'PENDIENTE', provIdFk: 2, proveedor_nombre: 'Hilos y Más SAS', costo_total: 180000, total_items: 1, detalles: [{ detAbsTip: 'MATERIAL', detAbsRefId: '3', detAbsRefNombre: 'Cremallera Metálica Dorada', detAbsCant: 30, detAbsCos: 6000 }] },
]

app.get('/abastecimientos', (req, res) => {
  const { pagina = 1, limite = 15 } = req.query
  res.json(paginate(ABASTECIMIENTOS, pagina, limite))
})

app.post('/abastecimientos', (req, res) => {
  const data = req.body
  const nuevo = {
    absId: ABASTECIMIENTOS.length + 1,
    absFec: new Date().toISOString().split('T')[0],
    absEst: 'PENDIENTE',
    provIdFk: data.provIdFk,
    proveedor_nombre: PROVEEDORES.find((p) => p.prov_id === parseInt(data.provIdFk))?.prov_nombre || '—',
    costo_total: (data.detalles || []).reduce((s, d) => s + (d.detAbsCos || 0) * (d.detAbsCant || 0), 0),
    total_items: (data.detalles || []).length,
    detalles: (data.detalles || []).map((d) => ({ ...d })),
  }
  ABASTECIMIENTOS.unshift(nuevo)
  res.status(201).json({ status: true, msg: 'Abastecimiento creado', data: nuevo })
})

app.patch('/abastecimientos/:id/completar', (req, res) => {
  const idx = ABASTECIMIENTOS.findIndex((a) => a.absId === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Abastecimiento no encontrado' })
  const abs = ABASTECIMIENTOS[idx]
  abs.absEst = 'COMPLETADO'
  ;(abs.detalles || []).forEach((d) => {
    if (d.detAbsTip === 'MATERIAL') {
      const mat = MATERIALES.find((m) => String(m.id) === d.detAbsRefId)
      if (mat) mat.cantidadDisponible = (mat.cantidadDisponible || 0) + (d.detAbsCant || 0)
    }
    if (d.detAbsTip === 'PRODUCTO') {
      const prod = PRODUCTOS.find((p) => String(p.id) === d.detAbsRefId)
      if (prod) prod.cantidadDisponible = (prod.cantidadDisponible || 0) + (d.detAbsCant || 0)
    }
  })
  res.json({ status: true, msg: 'Abastecimiento completado y stock actualizado' })
})

app.patch('/abastecimientos/:id/cancelar', (req, res) => {
  const idx = ABASTECIMIENTOS.findIndex((a) => a.absId === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json({ status: false, msg: 'Abastecimiento no encontrado' })
  ABASTECIMIENTOS[idx].absEst = 'CANCELADO'
  res.json({ status: true, msg: 'Abastecimiento cancelado' })
})

// ════════════════════════════════════════════
//  CATEGORÍAS
// ════════════════════════════════════════════

const CATEGORIAS = [
  { cat_id: 1, cat_nom: 'Formal', categoria_tipo_prenda: ['CAMISA', 'PANTALON', 'VESTIDO', 'BLUSA'], categoria_talla_referencia: ['XS', 'S', 'M', 'L', 'XL'] },
  { cat_id: 2, cat_nom: 'Casual', categoria_tipo_prenda: ['BLUSA', 'CAMISETA', 'JEANS', 'SHORT'], categoria_talla_referencia: ['XS', 'S', 'M', 'L', 'XL'] },
  { cat_id: 3, cat_nom: 'Fiesta', categoria_tipo_prenda: ['VESTIDO', 'FALDA', 'BLUSA'], categoria_talla_referencia: ['S', 'M', 'L'] },
  { cat_id: 4, cat_nom: 'Deportivo', categoria_tipo_prenda: ['CAMISETA', 'PANTALONETA', 'SUDADERA'], categoria_talla_referencia: ['S', 'M', 'L', 'XL', 'XXL'] },
  { cat_id: 5, cat_nom: 'Ropa Interior', categoria_tipo_prenda: ['BRIEF', 'BOXER', 'BRA'], categoria_talla_referencia: ['S', 'M', 'L', 'XL'] },
  { cat_id: 6, cat_nom: 'Uniformes', categoria_tipo_prenda: ['UNIFORME ESCOLAR', 'UNIFORME DEPORTIVO', 'UNIFORME EMPRESARIAL'], categoria_talla_referencia: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
]

app.get('/categorias', (_req, res) => res.json({ data: CATEGORIAS }))

// ════════════════════════════════════════════
//  MOVIMIENTOS
// ════════════════════════════════════════════

const TIPOS_MOV = ['COMPRA', 'VENTA', 'PRODUCCION', 'AJUSTE']
const SUMS_PROD = [
  { nombre: 'Camisa Oxford Manga Larga', referencia_id: 'PR00000055' },
  { nombre: 'Pantalón Clásico Tiro Alto', referencia_id: 'PR00000048' },
  { nombre: 'Vestido Noche Seda', referencia_id: 'PR00000062' },
  { nombre: 'Blusa Seda Estampada', referencia_id: 'PR00000033' },
]
const SUMS_MAT = [
  { nombre: 'Tela Algodón Premium', referencia_id: 'MT00000012' },
  { nombre: 'Hilo Poliéster Negro', referencia_id: 'MT00000023' },
  { nombre: 'Cremallera Metálica Dorada', referencia_id: 'MT00000034' },
  { nombre: 'Botones Camisa Blanca', referencia_id: 'MT00000045' },
]
const USUARIOS_MOV = [
  { user_id: '1007836498', user_nombres: 'Onalfa', user_apellidos: 'Cantillo' },
  { user_id: '1007836500', user_nombres: 'Carlos', user_apellidos: 'Mendoza' },
  { user_id: '1007836501', user_nombres: 'María', user_apellidos: 'González' },
  null,
]

const MOVIMIENTOS = Array.from({ length: 50 }, (_, i) => {
  const esProd = Math.random() > 0.5
  return {
    id_mov: 100 + i,
    tipo_mov: randomItem(TIPOS_MOV),
    tipo_suministro: esProd ? 'PRODUCTO' : 'MATERIAL',
    suministro: esProd ? randomItem(SUMS_PROD) : randomItem(SUMS_MAT),
    cantidad: Math.floor(Math.random() * 50) + 1,
    fecha: new Date(new Date('2025-01-01').getTime() + Math.random() * (new Date('2026-12-31').getTime() - new Date('2025-01-01').getTime())).toISOString().replace('T', ' ').slice(0, 19),
    usuario: randomItem(USUARIOS_MOV),
  }
}).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

app.get('/movimientos', (req, res) => {
  let filtrados = [...MOVIMIENTOS]
  const { pag = 1, usuario, fecha_desde, fecha_hasta, tipo_suministro, tipo_mov } = req.query
  if (usuario) {
    const q = usuario.toLowerCase()
    filtrados = filtrados.filter((m) => m.usuario && (m.usuario.user_id.toLowerCase().includes(q) || m.usuario.user_nombres.toLowerCase().includes(q) || m.usuario.user_apellidos.toLowerCase().includes(q)))
  }
  if (fecha_desde) filtrados = filtrados.filter((m) => new Date(m.fecha) >= new Date(fecha_desde))
  if (fecha_hasta) filtrados = filtrados.filter((m) => new Date(m.fecha) <= new Date(fecha_hasta + 'T23:59:59'))
  if (tipo_suministro) filtrados = filtrados.filter((m) => m.tipo_suministro === tipo_suministro)
  if (tipo_mov) filtrados = filtrados.filter((m) => m.tipo_mov === tipo_mov)
  const pagina = Math.max(1, parseInt(pag, 10) || 1)
  const maxPag = Math.max(1, Math.ceil(filtrados.length / 10))
  const inicio = (pagina - 1) * 10
  res.json({ maxPag, pagAct: Math.min(pagina, maxPag), data: filtrados.slice(inicio, inicio + 10) })
})

// ════════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🚀 Mock server completo → http://localhost:${PORT}`)
  console.log(`   ✓ Auth | Dashboard | Alertas | Clientes`)
  console.log(`   ✓ Ventas | Pedidos | Materiales | Productos`)
  console.log(`   ✓ Proveedores | Abastecimientos | Categorías | Movimientos\n`)
})
