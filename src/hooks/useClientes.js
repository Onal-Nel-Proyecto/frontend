import { useState, useCallback, useEffect, useRef } from "react";
import {
  getClientes as apiGetClientes,
  createCliente as apiCreateCliente,
  updateCliente as apiUpdateCliente,
  changeStatus as apiChangeStatus,
} from "../api/clientesService";

// ── Clientes de ejemplo para modo local ─────
const CLIENTES_EJEMPLO = [
  { id: 1, name: 'María García López', category: 'Activo', email: 'maria.garcia@email.com', phone: '300 123 4567', address: 'Calle 10 #20-30, Bogotá', lastOrder: 'Jan 15, 2025' },
  { id: 2, name: 'Alejandro Martínez Ruiz', category: 'Activo', email: 'alejandro.martinez@email.com', phone: '310 234 5678', address: 'Carrera 7 #45-67, Medellín', lastOrder: 'Jan 18, 2025' },
  { id: 3, name: 'Carmen Herrera Díaz', category: 'Activo', email: 'carmen.herrera@email.com', phone: '320 345 6789', address: 'Av siempre viva #123, Cali', lastOrder: 'Feb 1, 2025' },
  { id: 4, name: 'Roberto Sánchez Vega', category: 'Inactivo', email: 'roberto.sanchez@email.com', phone: '300 456 7890', address: 'Calle 5 #10-20, Barranquilla', lastOrder: 'Feb 5, 2025' },
  { id: 5, name: 'Laura Jiménez Torres', category: 'Activo', email: 'laura.jimenez@email.com', phone: '310 567 8901', address: 'Carrera 15 #30-45, Cartagena', lastOrder: 'Feb 10, 2025' },
  { id: 6, name: 'Fernando Ortiz Mendoza', category: 'Activo', email: 'fernando.ortiz@email.com', phone: '320 678 9012', address: 'Diagonal 60 #15-30, Bucaramanga', lastOrder: 'Mar 3, 2025' },
  { id: 7, name: 'Isabel Ramírez Castro', category: 'Activo', email: 'isabel.ramirez@email.com', phone: '300 789 0123', address: 'Calle 80 #12-34, Manizales', lastOrder: 'Mar 15, 2025' },
  { id: 8, name: 'Daniela Rojas Pineda', category: 'Inactivo', email: 'daniela.rojas@email.com', phone: '310 890 1234', address: 'Av 68 #23-45, Pereira', lastOrder: 'Apr 2, 2025' },
]

// ──────────────────────────────────────────────
//  Normaliza un item de la API → formato tabla
// ──────────────────────────────────────────────
const formatTelefonos = (telefonos) => {
  if (!telefonos || !Array.isArray(telefonos) || telefonos.length === 0) return "-"
  return telefonos
    .map((t) => (typeof t === "string" ? t : t.numero_telefono || t.numero || t.telefono || ""))
    .filter(Boolean)
    .join(", ")
}

const mapearCliente = (item) => ({
  id: parseInt(item.cliente_id, 10) || item.cliente_id,
  name: `${item.cliente_nombre || ""} ${item.cliente_apellido || ""}`.trim(),
  category:
    item.estado === "activo"
      ? "Activo"
      : item.estado === "inactivo"
        ? "Inactivo"
        : item.estado || "Activo",
  email: item.cliente_email || "",
  phone: formatTelefonos(item.cliente_telefonos),
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
  const loadClientes = useCallback(async (pagina = 1, limite = 15, search = '') => {
    setLoading(true);
    setError(null);

    // Timeout de seguridad: si la API tarda más de 10s, force loading=false
    const safetyTimer = setTimeout(() => {
      if (mounted.current) setLoading(false);
    }, 10000);

    try {
      const respuesta = await apiGetClientes(pagina, limite, search);
      const items = Array.isArray(respuesta?.data) ? respuesta.data : [];
      setClientes(items.map(mapearCliente));
      setMeta(respuesta?.meta ?? null);
    } catch (err) {
      // Si falla la API, cargamos datos de ejemplo
      console.warn("API no disponible, cargando datos de ejemplo:", err?.message);
      setClientes(CLIENTES_EJEMPLO);
      setMeta({ total: CLIENTES_EJEMPLO.length, pagina_actual: 1, paginas_totales: 1, limite });
    } finally {
      clearTimeout(safetyTimer);
      if (mounted.current) setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadClientes(paginaInicial, limiteInicial, '');
  }, [loadClientes, paginaInicial, limiteInicial]);

  // Cleanup
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // ── AGREGAR CLIENTE ──────────────────────────
  const addCliente = useCallback(
    async (clienteData, search = '') => {
      setLoading(true);
      setError(null);
      try {
        await apiCreateCliente(clienteData);
        await loadClientes(1, meta?.limite || limiteInicial, search);
      } catch (err) {
        // 🔸 Fallback local: agregar el cliente en memoria
        const nuevoId = ++localIdRef.current;
        const nuevoCliente = {
          id: nuevoId,
          name: `${clienteData.cliente_nombre || ""} ${clienteData.cliente_apellido || ""}`.trim(),
          category: "Activo",
          email: clienteData.cliente_email || "",
          phone: "-",
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
    async (id, clienteData, search = '') => {
      setLoading(true);
      setError(null);
      try {
        await apiUpdateCliente(id, clienteData);
        await loadClientes(meta?.pagina_actual || 1, meta?.limite || limiteInicial, search);
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

  // ── INHABILITAR (cambio de estado) ──────────
  const deleteCliente = useCallback(
    async (id, search = '') => {
      setLoading(true);
      setError(null);
      let msg = null;
      try {
        const response = await apiChangeStatus(id, 2);
        msg = response?.msg || null;
        await loadClientes(meta?.pagina_actual || 1, meta?.limite || limiteInicial, search);
      } catch (err) {
        // 🔸 Fallback local: eliminar del array
        setClientes((prev) => prev.filter((c) => c.id !== id));
        setMeta((prev) => prev ? { ...prev, total: Math.max(0, (prev.total || 0) - 1) } : null);
        console.info("🧪 Cliente eliminado en modo local:", id);
      } finally {
        if (mounted.current) setLoading(false);
      }
      return { ok: true, msg };
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
