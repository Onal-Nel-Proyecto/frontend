import { useState, useCallback, useEffect } from "react";
import {
  getAbastecimientos as apiGetAbastecimientos,
  createAbastecimiento as apiCreateAbastecimiento,
  completarAbastecimiento as apiCompletar,
  cancelarAbastecimiento as apiCancelar,
  getProveedores as apiGetProveedores,
} from "../api/abastecimientoService";

// ── Datos de ejemplo (fallback sin API) ──
const ABASTECIMIENTOS_EJEMPLO = [
  {
    id: 1,
    fecha: "2025-06-01 10:30:00",
    estado: "COMPLETADO",
    observacion: "Pedido mensual de telas",
    provIdFk: "PROV001",
    proveedor_nombre: "Textiles Nacionales S.A.",
    usuIdFk: "123",
    total_items: 3,
    costo_total: 450000,
    detalles: [
      { nombre: 'Seda Natural', cantidad: 10, costo: 15000 },
      { nombre: 'Algodón Premium', cantidad: 20, costo: 8000 },
      { nombre: 'Hilo Dorado', cantidad: 5, costo: 2000 },
    ],
  },
  {
    id: 2,
    fecha: "2025-06-10 14:15:00",
    estado: "PENDIENTE",
    observacion: null,
    provIdFk: "PROV002",
    proveedor_nombre: "Importadora Textil Ltda.",
    usuIdFk: "123",
    total_items: 2,
    costo_total: 280000,
    detalles: [
      { nombre: 'Vestido Lino', cantidad: 5, costo: 40000 },
      { nombre: 'Blazer Ejecutivo', cantidad: 2, costo: 40000 },
    ],
  },
  {
    id: 3,
    fecha: "2025-05-28 09:00:00",
    estado: "CANCELADO",
    observacion: "Proveedor no disponible",
    provIdFk: "PROV003",
    proveedor_nombre: "Distribuciones El Punto",
    usuIdFk: "456",
    total_items: 1,
    costo_total: 120000,
    detalles: [
      { nombre: 'Botones Premium', cantidad: 200, costo: 600 },
    ],
  },
];

const PROVEEDORES_EJEMPLO = [
  { provId: "PROV001", provNom: "Textiles Nacionales S.A.", provTel: "3101234567", provCorr: "ventas@textilesnac.com" },
  { provId: "PROV002", provNom: "Importadora Textil Ltda.", provTel: "3209876543", provCorr: "info@importextil.com" },
  { provId: "PROV003", provNom: "Distribuciones El Punto", provTel: "3001122334", provCorr: "elpunto@distri.com" },
];

// ── Mapear ítem de API a formato tabla ──
const mapearAbastecimiento = (item) => ({
  id: item.id ?? item.absId,
  fecha: item.fecha ?? item.absFec,
  estado: item.estado ?? item.absEst,
  observacion: (item.observacion || item.absObs) ?? "",
  proveedorId: item.provIdFk,
  proveedorNombre: item.proveedor_nombre,
  usuarioId: item.usuIdFk,
  totalItems: Number(item.total_items) || 0,
  costoTotal: Number(item.costo_total) || 0,
  detalles: Array.isArray(item.detalles) ? item.detalles.map((d) => ({
    nombre: d.referenciaNombre || d.nombre || d.detAbsRefId || '—',
    cantidad: Number(d.detAbsCant || d.cantidad || 0),
    costo: Number(d.detAbsCos || d.costo || 0),
  })) : [],
});

export const useAbastecimiento = ({ paginaInicial = 1, limiteInicial = 15 } = {}) => {
  const [abastecimientos, setAbastecimientos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Cargar abastecimientos ──
  const loadAbastecimientos = useCallback(async (pagina = 1, limite = 15) => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await apiGetAbastecimientos(pagina, limite);
      const items = Array.isArray(respuesta?.data) ? respuesta.data : [];
      setAbastecimientos(items.map(mapearAbastecimiento));
      setMeta(respuesta?.meta ?? null);
    } catch (err) {
      console.warn("API no disponible, cargando datos de ejemplo:", err?.message);
      setAbastecimientos(ABASTECIMIENTOS_EJEMPLO.map(mapearAbastecimiento));
      setMeta({ total: ABASTECIMIENTOS_EJEMPLO.length, pagina_actual: 1, paginas_totales: 1, limite });
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Cargar proveedores ──
  const loadProveedores = useCallback(async () => {
    try {
      const response = await apiGetProveedores();
      // El backend devuelve { meta, data } con prov_id/prov_nombre
      const raw = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      const list = raw.map(p => ({
        provId: p.prov_id || p.provId,
        provNom: p.prov_nombre || p.provNom,
        provTel: p.prov_telefono || p.provTel || '',
        provCorr: p.prov_correo || p.provCorr || '',
      }));
      if (list.length > 0) {
        setProveedores(list);
      } else {
        setProveedores(PROVEEDORES_EJEMPLO);
      }
    } catch (err) {
      console.warn("API de proveedores no disponible:", err?.message);
      setProveedores(PROVEEDORES_EJEMPLO);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadAbastecimientos(paginaInicial, limiteInicial);
    loadProveedores();
  }, [loadAbastecimientos, loadProveedores, paginaInicial, limiteInicial]);

  // ── Agregar abastecimiento ──
  const addAbastecimiento = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        await apiCreateAbastecimiento(data);
        await loadAbastecimientos(1, meta?.limite || limiteInicial);
      } catch (err) {
        console.error("Error al crear abastecimiento:", err?.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return { ok: true };
    },
    [loadAbastecimientos, meta]
  );

  // ── Completar abastecimiento ──
  const completar = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await apiCompletar(id);
        await loadAbastecimientos(meta?.pagina_actual || 1, meta?.limite || limiteInicial);
      } catch (err) {
        console.error("Error al completar abastecimiento:", err?.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return { ok: true };
    },
    [loadAbastecimientos, meta]
  );

  // ── Cancelar abastecimiento ──
  const cancelar = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await apiCancelar(id);
        await loadAbastecimientos(meta?.pagina_actual || 1, meta?.limite || limiteInicial);
      } catch (err) {
        console.error("Error al cancelar abastecimiento:", err?.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return { ok: true };
    },
    [loadAbastecimientos, meta]
  );

  return {
    abastecimientos,
    proveedores,
    meta,
    loading,
    error,
    loadAbastecimientos,
    loadProveedores,
    addAbastecimiento,
    completar,
    cancelar,
  };
};
