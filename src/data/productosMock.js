// ================================================================
// productosMock — Datos mock para buscar productos como plantilla
// Mientras se termina el endpoint real GET /productos/search?q=
// ================================================================

const productosMock = [
  {
    producto_id: 1,
    nombre: 'Camisa Oxford Clásica',
    tipo_prenda: 'CAMISA',
    talla: 'M',
    precio: 45000,
    genero: 'M',
    categoria_id: 1,
    categoria: 'Camisas',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 52 },
      { medida_id: 2, medida_nombre: 'Cintura', medida_valor: 44 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 76 },
    ],
  },
  {
    producto_id: 2,
    nombre: 'Camisa Slim Fit Blanca',
    tipo_prenda: 'CAMISA',
    talla: 'L',
    precio: 52000,
    genero: 'M',
    categoria_id: 1,
    categoria: 'Camisas',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 54 },
      { medida_id: 2, medida_nombre: 'Cintura', medida_valor: 46 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 78 },
    ],
  },
  {
    producto_id: 3,
    nombre: 'Pantalón Pinza Tiro Alto',
    tipo_prenda: 'PANTALON',
    talla: '40',
    precio: 68000,
    genero: 'F',
    categoria_id: 2,
    categoria: 'Pantalones',
    medidas: [
      { medida_id: 2, medida_nombre: 'Cintura', medida_valor: 38 },
      { medida_id: 3, medida_nombre: 'Cadera', medida_valor: 52 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 102 },
    ],
  },
  {
    producto_id: 4,
    nombre: 'Vestido Floral Estampado',
    tipo_prenda: 'VESTIDO',
    talla: 'S',
    precio: 75000,
    genero: 'F',
    categoria_id: 3,
    categoria: 'Vestidos',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 46 },
      { medida_id: 2, medida_nombre: 'Cintura', medida_valor: 38 },
      { medida_id: 3, medida_nombre: 'Cadera', medida_valor: 50 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 88 },
    ],
  },
  {
    producto_id: 5,
    nombre: 'Chaqueta Vaquera Oversize',
    tipo_prenda: 'CHAQUETA',
    talla: 'XL',
    precio: 95000,
    genero: 'M',
    categoria_id: 4,
    categoria: 'Chaquetas',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 60 },
      { medida_id: 4, medida_nombre: 'Largo de manga', medida_valor: 65 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 74 },
    ],
  },
  {
    producto_id: 6,
    nombre: 'Polo Algodón Piqué',
    tipo_prenda: 'POLO',
    talla: 'M',
    precio: 32000,
    genero: 'M',
    categoria_id: 1,
    categoria: 'Camisas',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 50 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 72 },
    ],
  },
  {
    producto_id: 7,
    nombre: 'Jean Recto Tiro Medio',
    tipo_prenda: 'JEAN',
    talla: '38',
    precio: 72000,
    genero: 'M',
    categoria_id: 2,
    categoria: 'Pantalones',
    medidas: [
      { medida_id: 2, medida_nombre: 'Cintura', medida_valor: 42 },
      { medida_id: 3, medida_nombre: 'Cadera', medida_valor: 54 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 108 },
    ],
  },
  {
    producto_id: 8,
    nombre: 'Fanda Plisada tableada',
    tipo_prenda: 'FALDA',
    talla: 'S',
    precio: 38000,
    genero: 'F',
    categoria_id: 5,
    categoria: 'Faldas',
    medidas: [
      { medida_id: 2, medida_nombre: 'Cintura', medida_valor: 34 },
      { medida_id: 3, medida_nombre: 'Cadera', medida_valor: 48 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 56 },
    ],
  },
  {
    producto_id: 9,
    nombre: 'Buso Algodón Capota',
    tipo_prenda: 'BUSO',
    talla: 'L',
    precio: 55000,
    genero: 'U',
    categoria_id: 4,
    categoria: 'Chaquetas',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 56 },
      { medida_id: 4, medida_nombre: 'Largo de manga', medida_valor: 62 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 70 },
    ],
  },
  {
    producto_id: 10,
    nombre: 'Camiseta Cuello Redondo Basic',
    tipo_prenda: 'CAMISETA',
    talla: 'M',
    precio: 18000,
    genero: 'U',
    categoria_id: 1,
    categoria: 'Camisas',
    medidas: [
      { medida_id: 1, medida_nombre: 'Pecho', medida_valor: 48 },
      { medida_id: 5, medida_nombre: 'Largo total', medida_valor: 68 },
    ],
  },
];

export default productosMock;

/** Simula la búsqueda con debounce (filtro local) */
export const buscarProductosMock = (query) => {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  return productosMock.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.tipo_prenda?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q) ||
      p.genero?.toLowerCase().includes(q)
  );
};
