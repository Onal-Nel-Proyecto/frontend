// ================================================================
// format.js — Utilidades de formateo general
// Funciones reutilizables para moneda, fechas y cadenas.
// ================================================================

/**
 * Formatea un valor numérico como COP (pesos colombianos).
 * Retorna '$0' si el valor no es un número válido.
 *
 * @param {number|string} value
 * @returns {string}
 *
 * @example
 *   formatCurrency(1500000)  // '$1.500.000'
 *   formatCurrency('abc')    // '$0'
 */
export const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(num);
};

/**
 * Convierte una fecha ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) al
 * formato colombiano DD/MM/YYYY. Retorna '—' si recibe null/undefined.
 *
 * @param {string|null|undefined} str
 * @returns {string}
 *
 * @example
 *   formatDate('2025-03-15')           // '15/03/2025'
 *   formatDate('2025-03-15T10:30:00')  // '15/03/2025'
 *   formatDate(null)                   // '—'
 */
export const formatDate = (str) => {
  if (!str) return '—';

  const datePart = str.split('T')[0];
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) return str;

  return `${day}/${month}/${year}`;
};

/**
 * Agrega padding de ceros a la izquierda hasta alcanzar el ancho dado.
 * Por defecto 2 caracteres (útil para días/meses).
 *
 * @param {number|string} n
 * @param {number} width
 * @returns {string}
 *
 * @example
 *   pad(5)    // '05'
 *   pad(15)   // '15'
 */
export const pad = (n, width = 2) => String(n).padStart(width, '0');
