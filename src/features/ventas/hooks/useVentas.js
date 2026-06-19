import { useState, useCallback, useEffect } from "react";
import {
  getVentas as apiGetVentas,
  getVentaById as apiGetVentaById,
  createVenta as apiCreateVenta,
  changeEstadoVenta as apiChangeEstado,
  deleteVenta as apiDeleteVenta,
} from "../services/ventasService";

// ── Mapear venta de API a formato de frontend ──
// Backend real devuelve: { venta_id, cliente: { cliente_nombres, cliente_apellidos }, 
//   pagos: { total_pagado, total_pendiente }, estado, total, fecha_registro, ... }
const mapearVenta = (item) => {
  // Cliente: backend lo envía como objeto { cliente_id, cliente_nombres, cliente_apellidos }
  const cli = item.cliente || {};
  const nombreCliente = typeof item.cliente === 'object' && item.cliente !== null
    ? `${cli.cliente_nombres || ''} ${cli.cliente_apellidos || ''}`.trim() || '—'
    : item.cliente_nombres
        ? `${item.cliente_nombres || ''} ${item.cliente_apellidos || ''}`.trim() || '—'
        : typeof item.cliente === 'string'
            ? item.cliente
            : '—';

  // Total pagado: backend lo envía dentro de item.pagos.total_pagado
  const abonado = Number(item.pagos?.total_pagado ?? item.total_pagado ?? item.abonado ?? item.pagado ?? 0);

  // Normalizar estado: "PAGADO" → "Pagado", "ADELANTADO" → "Abono parcial", "SIN PAGAR" → "Pendiente"
  const normalizarEstado = (est) => {
    if (!est) return 'Pendiente';
    const map = {
      'PAGADO': 'Pagado',
      'PENDIENTE': 'Pendiente',
      'SIN PAGAR': 'Pendiente',
      'CANCELADO': 'Cancelado',
      'ANULADO': 'Cancelado',
      'ADELANTADO': 'Abono parcial',
      'ABONO_PARCIAL': 'Abono parcial',
      'ABONO PARCIAL': 'Abono parcial',
    };
    return map[est.toUpperCase()] || est.charAt(0).toUpperCase() + est.slice(1).toLowerCase();
  };

  // Procesar detalles: backend los envía como { meta, data: [...] }
  // en GET /ventas/:id; en el listado no vienen.
  const detallesRaw = item.detalles || item.productos || [];
  const detallesArr = Array.isArray(detallesRaw)
    ? detallesRaw
    : Array.isArray(detallesRaw?.data)
      ? detallesRaw.data
      : [];

  return {
    id: item.id || item.venta_id,
    pedido_id: item.pedido_id || null,
    cliente: nombreCliente,
    descripcion: item.descripcion || '',
    total: Number(item.total) || 0,
    descuento: Number(item.descuento) || 0,
    abonado,
    metodo: item.metodo || item.metodo_pago || null,
    estado: normalizarEstado(item.estado),
    fecha_limite_pago: item.fecha_limite_pago
      ? (() => {
          const [y, m, d] = item.fecha_limite_pago.split('-');
          return `${d}/${m}/${y}`;
        })()
      : null,
    fecha: (() => {
      const raw = item.fecha || item.fecha_registro || item.created_at?.split('T')[0] || '';
      if (!raw) return '—';
      const parts = raw.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
      }
      return raw;
    })(),
    productos: detallesArr.map((d) => ({
      nombre: d.producto?.producto_nombre || d.producto?.nombre || d.nombre || 'Producto',
      cantidad: d.cantidad || d.cant || 1,
      precio_unitario: d.precio || d.precio_unitario || 0,
      subtotal: d.subtotal || (d.cantidad || 1) * (d.precio || 0),
    })),
  };
};

export const useVentas = ({ paginaInicial = 1, limiteInicial = 15 } = {}) => {
  const [ventas, setVentas] = useState([]);
  const [meta, setMeta] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Cargar ventas con filtros ──
  const loadVentas = useCallback(async ({ pagina = 1, limite = 15, busqueda, estado } = {}, signal) => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await apiGetVentas({ pagina, limite, busqueda, estado });
      if (signal?.aborted) return;
      const items = Array.isArray(respuesta?.data) ? respuesta.data : Array.isArray(respuesta?.ventas) ? respuesta.ventas : Array.isArray(respuesta) ? respuesta : [];
      setVentas(items.map(mapearVenta));
      setMeta(respuesta?.meta ?? null);
      setResumen(respuesta?.resumen ?? null);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Error al cargar ventas:", err?.message);
      setError(err);
      setVentas([]);
      setMeta(null);
      setResumen(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  // ── Obtener una venta por ID ──
  const getVenta = useCallback(async (id) => {
    try {
      const respuesta = await apiGetVentaById(id);
      return mapearVenta(respuesta?.data || respuesta);
    } catch (err) {
      console.error("Error al obtener venta:", err?.message);
      return null;
    }
  }, []);

  // ── Agregar venta ──
  const addVenta = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      await apiCreateVenta(data);
      await loadVentas({ pagina: 1, limite: meta?.limite || limiteInicial });
    } catch (err) {
      console.error("Error al crear venta:", err?.message);
      throw err;
    } finally {
      setLoading(false);
    }
    return { ok: true };
  }, [loadVentas, meta, limiteInicial]);

  // ── Cambiar estado ──
  const cambiarEstado = useCallback(async (id, estado) => {
    setLoading(true);
    setError(null);
    try {
      await apiChangeEstado(id, estado);
      await loadVentas({ pagina: meta?.pagina_actual || 1, limite: meta?.limite || limiteInicial });
    } catch (err) {
      console.error("Error al cambiar estado de venta:", err?.message);
      throw err;
    } finally {
      setLoading(false);
    }
    return { ok: true };
  }, [loadVentas, meta, limiteInicial]);

  // ── Anular venta ──
  const anularVenta = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiDeleteVenta(id);
      await loadVentas({ pagina: 1, limite: meta?.limite || limiteInicial });
    } catch (err) {
      console.error("Error al anular venta:", err?.message);
      throw err;
    } finally {
      setLoading(false);
    }
    return { ok: true };
  }, [loadVentas, meta, limiteInicial]);

  return {
    ventas,
    meta,
    resumen,
    loading,
    error,
    loadVentas,
    getVenta,
    addVenta,
    cambiarEstado,
    anularVenta,
  };
};
