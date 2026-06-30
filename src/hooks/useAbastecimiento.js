import { useState, useCallback, useEffect, useRef } from "react";
import {
  getAbastecimientos as apiGetAbastecimientos,
  createAbastecimiento as apiCreateAbastecimiento,
  completarAbastecimiento as apiCompletar,
  cancelarAbastecimiento as apiCancelar,
  getProveedores as apiGetProveedores,
} from "../api/abastecimientoService";

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
    tipo: d.detAbsTip || d.tipo || d.det_abs_tipo || '',
    refId: String(d.detAbsRefId || d.det_abs_ref_id || d.refId || ''),
    nombre: d.nombre_suministro || d.detAbsRefNombre || d.det_abs_ref_nombre || d.referenciaNombre || d.nombre_suministro_ref || d.nombre || `Ref #${d.detAbsRefId || d.det_abs_ref_id || d.refId || '—'}`,
    cantidad: Number(d.detAbsCant || d.det_abs_cant || d.det_abs_cantidad || d.cantidad || 0),
    costo: Number(d.detAbsCos || d.det_abs_costo || d.det_abs_cos || d.costo || d.costo_unitario || d.precio || d.precio_unitario || 0),
  })) : [],
});

export const useAbastecimiento = ({ paginaInicial = 1, limiteInicial = 15 } = {}) => {
  const [abastecimientos, setAbastecimientos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [meta, setMeta] = useState(null);
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta]);
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
      console.error("Error al cargar abastecimientos:", err?.message);
      setAbastecimientos([]);
      setMeta(null);
      setError(err?.response?.data?.error || err?.message || 'Error al cargar abastecimientos');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Cargar proveedores ──
  const loadProveedores = useCallback(async () => {
    try {
      const response = await apiGetProveedores();
      // Soportar múltiples formatos de respuesta del backend
      let raw = [];
      if (Array.isArray(response?.data)) {
        raw = response.data;
      } else if (Array.isArray(response?.proveedores)) {
        raw = response.proveedores;
      } else if (Array.isArray(response)) {
        raw = response;
      }
      const list = raw.map(p => ({
        provId: p.prov_id || p.provId || p.id || p.proveedor_id || '',
        provNom: p.prov_nombre || p.provNom || p.nombre || p.razon_social || p.nombre_proveedor || '',
        provTel: p.prov_telefono || p.provTel || p.telefono || '',
        provCorr: p.prov_correo || p.provCorr || p.correo || p.email || '',
      }));
      setProveedores(list);
    } catch (err) {
      console.error("Error al cargar proveedores:", err?.message);
      setProveedores([]);
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
        await loadAbastecimientos(1, metaRef.current?.limite || limiteInicial);
      } catch (err) {
        console.error("Error al crear abastecimiento:", err?.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return { ok: true };
    },
    [loadAbastecimientos, limiteInicial]
  );

  // ── Completar abastecimiento ──
  const completar = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await apiCompletar(id);
        await loadAbastecimientos(metaRef.current?.pagina_actual || 1, metaRef.current?.limite || limiteInicial);
      } catch (err) {
        console.error("Error al completar abastecimiento:", err?.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return { ok: true };
    },
    [loadAbastecimientos, limiteInicial]
  );

  // ── Cancelar abastecimiento ──
  const cancelar = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await apiCancelar(id);
        await loadAbastecimientos(metaRef.current?.pagina_actual || 1, metaRef.current?.limite || limiteInicial);
      } catch (err) {
        console.error("Error al cancelar abastecimiento:", err?.message);
        throw err;
      } finally {
        setLoading(false);
      }
      return { ok: true };
    },
    [loadAbastecimientos, limiteInicial]
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
