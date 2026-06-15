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
    absId: 1,
    absFec: "2025-06-01 10:30:00",
    absEst: "COMPLETADO",
    absObs: "Pedido mensual de telas",
    provIdFk: "PROV001",
    proveedor_nombre: "Textiles Nacionales S.A.",
    usuIdFk: "123",
    total_items: 3,
    costo_total: 450000,
  },
  {
    absId: 2,
    absFec: "2025-06-10 14:15:00",
    absEst: "PENDIENTE",
    absObs: null,
    provIdFk: "PROV002",
    proveedor_nombre: "Importadora Textil Ltda.",
    usuIdFk: "123",
    total_items: 2,
    costo_total: 280000,
  },
  {
    absId: 3,
    absFec: "2025-05-28 09:00:00",
    absEst: "CANCELADO",
    absObs: "Proveedor no disponible",
    provIdFk: "PROV003",
    proveedor_nombre: "Distribuciones El Punto",
    usuIdFk: "456",
    total_items: 1,
    costo_total: 120000,
  },
];

const PROVEEDORES_EJEMPLO = [
  { provId: "PROV001", provNom: "Textiles Nacionales S.A.", provTel: "3101234567", provCorr: "ventas@textilesnac.com" },
  { provId: "PROV002", provNom: "Importadora Textil Ltda.", provTel: "3209876543", provCorr: "info@importextil.com" },
  { provId: "PROV003", provNom: "Distribuciones El Punto", provTel: "3001122334", provCorr: "elpunto@distri.com" },
];

// ── Mapear ítem de API a formato tabla ──
const mapearAbastecimiento = (item) => ({
  id: item.absId,
  fecha: item.absFec,
  estado: item.absEst,
  observacion: item.absObs || "",
  proveedorId: item.provIdFk,
  proveedorNombre: item.proveedor_nombre,
  usuarioId: item.usuIdFk,
  totalItems: Number(item.total_items) || 0,
  costoTotal: Number(item.costo_total) || 0,
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
      const data = await apiGetProveedores();
      if (Array.isArray(data) && data.length > 0) {
        setProveedores(data);
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
