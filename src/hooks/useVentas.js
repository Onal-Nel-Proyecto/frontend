import { useState, useCallback, useEffect, useRef } from "react";
import {
  getVentas as apiGetVentas,
  getVentaById as apiGetVentaById,
  createVenta as apiCreateVenta,
  changeEstadoVenta as apiChangeEstado,
} from "../api/ventasService";

// ── Datos de ejemplo (fallback sin API) ──
const VENTAS_EJEMPLO = [
  { id: 1, pedido_id: "PED-001", cliente: "María García López", descripcion: "Vestido de Noche Seda — Talla M", total: 520000, abonado: 520000, metodo: "transferencia", estado: "Pagado", fecha: "2025-01-15", productos: [{ nombre: "Vestido de Noche Seda", cantidad: 1, precio_unitario: 520000 }] },
  { id: 2, pedido_id: "PED-003", cliente: "Alejandro Martínez Ruiz", descripcion: "Blazer Lino Clásico — Talla L", total: 245000, abonado: 245000, metodo: "tarjeta", estado: "Pagado", fecha: "2025-01-18", productos: [{ nombre: "Blazer Lino Clásico", cantidad: 1, precio_unitario: 245000 }] },
  { id: 3, pedido_id: "PED-007", cliente: "Carmen Herrera Díaz", descripcion: "Vestido de Día Lino + Pañuelo Seda", total: 315000, abonado: 150000, metodo: "efectivo", estado: "Abono parcial", fecha: "2025-02-01", productos: [{ nombre: "Vestido de Día Lino", cantidad: 1, precio_unitario: 250000 }, { nombre: "Pañuelo Seda", cantidad: 1, precio_unitario: 65000 }] },
  { id: 4, pedido_id: "PED-012", cliente: "Roberto Sánchez Vega", descripcion: "Corbata Terciopelo Italia x2", total: 170000, abonado: 0, metodo: null, estado: "Pendiente", fecha: "2025-02-05", productos: [{ nombre: "Corbata Terciopelo Italia", cantidad: 2, precio_unitario: 85000 }] },
  { id: 5, pedido_id: "PED-015", cliente: "Laura Jiménez Torres", descripcion: "Pañuelo Seda Tussar + Vestido Noche", total: 440000, abonado: 200000, metodo: "transferencia", estado: "Abono parcial", fecha: "2025-02-10", productos: [{ nombre: "Pañuelo Seda Tussar", cantidad: 1, precio_unitario: 120000 }, { nombre: "Vestido Noche", cantidad: 1, precio_unitario: 320000 }] },
];

// ── Mapear venta de API a formato de frontend ──
const mapearVenta = (item) => ({
  id: item.id || item.venta_id,
  pedido_id: item.pedido_id || `VENT-${item.id}`,
  cliente: item.cliente_nombre || item.cliente || "—",
  descripcion: item.descripcion || "",
  total: Number(item.total) || 0,
  abonado: Number(item.abonado || item.pagado || 0),
  metodo: item.metodo || null,
  estado: item.estado || "Pendiente",
  fecha: item.fecha || item.created_at?.split("T")[0] || "—",
  productos: item.productos || item.detalles || [],
});

export const useVentas = ({ paginaInicial = 1, limiteInicial = 15 } = {}) => {
  const [ventas, setVentas] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  // ── Cargar ventas ──
  const loadVentas = useCallback(async (pagina = 1, limite = 15) => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await apiGetVentas(pagina, limite);
      const items = Array.isArray(respuesta?.data) ? respuesta.data : [];
      setVentas(items.map(mapearVenta));
      setMeta(respuesta?.meta ?? null);
    } catch (err) {
      console.warn("API no disponible, cargando datos de ejemplo:", err?.message);
      setVentas(VENTAS_EJEMPLO.map(mapearVenta));
      setMeta({ total: VENTAS_EJEMPLO.length, pagina_actual: 1, paginas_totales: 1, limite });
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // ── Obtener una venta por ID ──
  const getVenta = useCallback(async (id) => {
    try {
      const respuesta = await apiGetVentaById(id);
      return mapearVenta(respuesta?.data || respuesta);
    } catch (err) {
      console.warn("API no disponible, buscando en datos de ejemplo:", err?.message);
      const encontrada = VENTAS_EJEMPLO.find(
        (v) => String(v.id) === String(id) || String(v.pedido_id) === String(id)
      );
      return encontrada ? mapearVenta(encontrada) : null;
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadVentas(paginaInicial, limiteInicial);
  }, [loadVentas, paginaInicial, limiteInicial]);

  // Cleanup
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // ── Agregar venta ──
  const addVenta = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      await apiCreateVenta(data);
      await loadVentas(1, meta?.limite || limiteInicial);
    } catch (err) {
      console.error("Error al crear venta:", err?.message);
      throw err;
    } finally {
      if (mounted.current) setLoading(false);
    }
    return { ok: true };
  }, [loadVentas, meta, limiteInicial]);

  // ── Cambiar estado ──
  const cambiarEstado = useCallback(async (id, estado) => {
    setLoading(true);
    setError(null);
    try {
      await apiChangeEstado(id, estado);
      await loadVentas(meta?.pagina_actual || 1, meta?.limite || limiteInicial);
    } catch (err) {
      console.error("Error al cambiar estado de venta:", err?.message);
      throw err;
    } finally {
      if (mounted.current) setLoading(false);
    }
    return { ok: true };
  }, [loadVentas, meta, limiteInicial]);

  return {
    ventas,
    meta,
    loading,
    error,
    loadVentas,
    getVenta,
    addVenta,
    cambiarEstado,
  };
};
