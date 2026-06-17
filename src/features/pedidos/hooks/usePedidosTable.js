// ================================================================
// usePedidosTable — Hook que centraliza la lógica de:
//   - Fetch de pedidos con paginación, búsqueda y filtros
//   - Sincronización con URL (searchParams)
//   - Búsqueda server-side (backend ?cliente=) con debounce
//   - Filtro client-side complementario (id/descripción)
// ================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getPedidos } from "../services/pedidosService";
import { useCancelPedido } from "./useCancelPedido";

const FILTER_KEYS = [
  "fecha_desde", "fecha_hasta", "tipo_pedido", "tipo_prenda", "estado_pago",
  "estado", "fecha_entrega_desde", "fecha_entrega_hasta",
];

const SEARCH_DEBOUNCE_MS = 400;

/**
 * @param {number} current — Página actual
 * @param {number} total — Total de páginas
 * @returns {Array<number|string>} Array de páginas con "..." para saltos
 */
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 2) end = 3;
  if (current >= total - 1) start = total - 2;

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");

  pages.push(total);
  return pages;
};

/**
 * Lee filtros activos desde searchParams
 */
const readFiltrosFromParams = (searchParams) => {
  const params = {};
  let hasAny = false;
  for (const key of FILTER_KEYS) {
    const val = searchParams.get(key);
    if (val) {
      params[key] = val;
      hasAny = true;
    }
  }
  return hasAny ? params : null;
};

export { getPageNumbers };

/**
 * @returns {{
 *   pedidos: Array,
 *   loading: boolean,
 *   pagAct: number,
 *   maxPag: number,
 *   search: string,
 *   setSearch: Function,
 *   setPagAct: Function,
 *   filtros: object,
 *   setFiltros: Function,
 *   filtrosActivos: object|null,
 *   setFiltrosActivos: Function,
 *   showFiltros: boolean,
 *   setShowFiltros: Function,
 *   filtered: Array,
 *   pageNumbers: Array,
 *   // Cancelación
 *   cancelTarget, cancelMotivo, cancelLoading, cancelResult,
 *   iniciarCancelacion, setCancelMotivo, confirmarCancelacion, cancelarDialogo,
 * }}
 */
export const usePedidosTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef(null);

  // ─── Estado ───
  const [pedidos, setPedidos] = useState([]);
  const [maxPag, setMaxPag] = useState(1);
  const [pagAct, setPagAct] = useState(() => {
    const p = parseInt(searchParams.get("pagina"), 10);
    return p >= 1 ? p : 1;
  });
  const [search, setSearch] = useState(() => searchParams.get("busqueda") || "");
  // Versión debounced del search que se envía al backend
  const [searchServer, setSearchServer] = useState(() => searchParams.get("busqueda") || "");
  const [loading, setLoading] = useState(true);

  const [filtros, setFiltros] = useState(() => ({
    fecha_desde: searchParams.get("fecha_desde") || "",
    fecha_hasta: searchParams.get("fecha_hasta") || "",
    tipo_pedido: searchParams.get("tipo_pedido") || "",
    tipo_prenda: searchParams.get("tipo_prenda") || "",
    estado_pago: searchParams.get("estado_pago") || "",
    estado: searchParams.get("estado") || "pendiente,en proceso",
    fecha_entrega_desde: searchParams.get("fecha_entrega_desde") || "",
    fecha_entrega_hasta: searchParams.get("fecha_entrega_hasta") || "",
  }));

  const [filtrosActivos, setFiltrosActivos] = useState(() => {
    const fromParams = readFiltrosFromParams(searchParams);
    if (fromParams) return fromParams;
    // Por defecto: mostrar solo pendientes y en proceso
    return { estado: "pendiente,en proceso" };
  });
  const [showFiltros, setShowFiltros] = useState(false);

  // ─── Cancelación ───
  const cancelProps = useCancelPedido();

  // ─── Debounce del search ───
  const handleSearch = useCallback((value) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchServer(value);
      setPagAct(1);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // ─── Fetch de pedidos (server-side: paginación, filtros, búsqueda por cliente) ───
  useEffect(() => {
    let cancel = false;
    const fetch = async () => {
      try {
        const filtrosLimpios = {};
        if (filtrosActivos) {
          for (const key of FILTER_KEYS) {
            const val = filtrosActivos[key];
            if (!val) continue;
            // "todos" se muestra en la URL pero no se envía al backend
            if (key === 'estado' && val === 'todos') continue;
            filtrosLimpios[key] = val;
          }
        }
        // Búsqueda server-side por nombre de cliente
        if (searchServer) filtrosLimpios.cliente = searchServer;

        const resp = await getPedidos(pagAct, filtrosLimpios);
        if (cancel) return;
        setPedidos(resp.data || []);
        setMaxPag(resp.maxPag || 1);
      } catch (err) {
        console.warn("[TablaPedidos] Error al cargar pedidos:", err?.message || err);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancel = true;
    };
  }, [pagAct, filtrosActivos, searchServer]);

  // ─── Sincronizar estado a la URL ───
  useEffect(() => {
    const params = new URLSearchParams();
    if (pagAct > 1) params.set("pagina", String(pagAct));
    if (search) params.set("busqueda", search);
    if (filtrosActivos) {
      for (const [key, val] of Object.entries(filtrosActivos)) {
        if (!val) continue;
        // "Por defecto" (pendiente,en proceso) no se muestra en la URL
        if (key === 'estado' && val === 'pendiente,en proceso') continue;
        params.set(key, val);
      }
    }
    setSearchParams(params, { replace: true });
  }, [pagAct, search, filtrosActivos, setSearchParams]);

  // ─── Filtro client-side complementario (id/descripción — el backend solo filtra por cliente) ───
  const filtered = useMemo(() => {
    // Si el backend ya filtró por cliente, solo queda filtrar por id/descripción
    if (!search) return pedidos;
    const q = search.toLowerCase();
    return pedidos.filter(
      (p) =>
        p.id?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
    );
  }, [pedidos, search]);

  // ─── Números de página ───
  const pageNumbers = useMemo(() => getPageNumbers(pagAct, maxPag), [pagAct, maxPag]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    pedidos,
    loading,
    pagAct,
    maxPag,
    search,
    searchServer,
    setSearch: handleSearch,
    setPagAct,
    filtros,
    setFiltros,
    filtrosActivos,
    setFiltrosActivos,
    showFiltros,
    setShowFiltros,
    filtered,
    pageNumbers,
    // Cancelación
    ...cancelProps,
  };
};
