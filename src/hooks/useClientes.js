import { useState, useCallback, useEffect, useRef } from "react";
import {
  getClientes as apiGetClientes,
  createCliente as apiCreateCliente,
  updateCliente as apiUpdateCliente,
  changeStatus as apiChangeStatus,
} from "../api/clientesService";

// ──────────────────────────────────────────────
//  Normaliza un item de la API → formato tabla
// ──────────────────────────────────────────────
const mapearCliente = (item) => ({
  id: parseInt(item.cliente_id, 10) || item.cliente_id,
  name: `${item.cliente_nombre || ""} ${item.cliente_apellido || ""}`.trim(),
  category:
    item.estado === "activo"
      ? "Activo"
      : item.estado === "inactivo"
        ? "Inactivo"
        : item.estado || "Activo",
  phone: item.cliente_email || "",
  address: item.cliente_direccion || "",
  lastOrder: item.fecha_creacion || null,
});

// ──────────────────────────────────────────────
//  Hook
// ──────────────────────────────────────────────

export const useClientes = ({ paginaInicial = 1, limiteInicial = 15 } = {}) => {
  const [clientes, setClientes] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contador interno para IDs locales
  const localIdRef = useRef(100);

  const mounted = useRef(true);

  // ── CARGAR CLIENTES ──────────────────────────
  const loadClientes = useCallback(async (pagina = 1, limite = 15) => {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await apiGetClientes(pagina, limite);
      const items = Array.isArray(respuesta?.data) ? respuesta.data : [];
      setClientes(items.map(mapearCliente));
      setMeta(respuesta?.meta ?? null);
    } catch (err) {
      // Si falla la API, manejamos todo en local
      console.warn("API no disponible, usando modo local:", err?.message);
      setMeta({ total: clientes.length, pagina_actual: 1, paginas_totales: 1, limite });
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadClientes(paginaInicial, limiteInicial);
  }, [loadClientes, paginaInicial, limiteInicial]);

  // Cleanup
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // ── AGREGAR CLIENTE ──────────────────────────
  const addCliente = useCallback(
    async (clienteData) => {
      setLoading(true);
      setError(null);
      try {
        await apiCreateCliente(clienteData);
        await loadClientes(1, meta?.limite || limiteInicial);
      } catch (err) {
        // 🔸 Fallback local: agregar el cliente en memoria
        const nuevoId = ++localIdRef.current;
        const nuevoCliente = {
          id: nuevoId,
          name: `${clienteData.cliente_nombre || ""} ${clienteData.cliente_apellido || ""}`.trim(),
          category: "Activo",
          phone: clienteData.cliente_email || "",
          address: clienteData.cliente_direccion || "",
          lastOrder: new Date().toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
        };
        setClientes((prev) => [nuevoCliente, ...prev]);
        setMeta((prev) => prev ? { ...prev, total: (prev.total || 0) + 1 } : null);
        console.info("🧪 Cliente agregado en modo local:", nuevoCliente);
      } finally {
        if (mounted.current) setLoading(false);
      }
      return { ok: true };
    },
    [loadClientes, meta]
  );

  // ── ACTUALIZAR CLIENTE ───────────────────────
  const editCliente = useCallback(
    async (id, clienteData) => {
      setLoading(true);
      setError(null);
      try {
        await apiUpdateCliente(id, clienteData);
        await loadClientes(meta?.pagina_actual || 1, meta?.limite || limiteInicial);
      } catch (err) {
        // 🔸 Fallback local: actualizar en memoria
        setClientes((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: `${clienteData.cliente_nombre || ""} ${clienteData.cliente_apellido || ""}`.trim(),
                  phone: clienteData.cliente_email || "",
                  address: clienteData.cliente_direccion || "",
                }
              : c
          )
        );
        console.info("🧪 Cliente actualizado en modo local:", id);
      } finally {
        if (mounted.current) setLoading(false);
      }
      return { ok: true };
    },
    [loadClientes, meta]
  );

  // ── ELIMINAR (cambio de estado) ──────────────
  const deleteCliente = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await apiChangeStatus(id, 2);
        await loadClientes(meta?.pagina_actual || 1, meta?.limite || limiteInicial);
      } catch (err) {
        // 🔸 Fallback local: eliminar del array
        setClientes((prev) => prev.filter((c) => c.id !== id));
        setMeta((prev) => prev ? { ...prev, total: Math.max(0, (prev.total || 0) - 1) } : null);
        console.info("🧪 Cliente eliminado en modo local:", id);
      } finally {
        if (mounted.current) setLoading(false);
      }
      return { ok: true };
    },
    [loadClientes, meta]
  );

  return {
    clientes,
    meta,
    loading,
    error,
    loadClientes,
    addCliente,
    editCliente,
    deleteCliente,
  };
};
