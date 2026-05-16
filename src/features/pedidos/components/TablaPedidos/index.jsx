// ================================================================
// TablaPedidos — Tabla del listado completo de pedidos
// Obtiene los datos desde GET /pedidos del backend.
// Incluye: búsqueda, filtro local, badges, paginación,
// menú de acciones por fila, color según días faltantes.
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { getPedidos } from '../../services/pedidosService';
import styles from './TablaPedidos.module.css';

// ─── Mapa de estados ───
const statusMap = {
  PENDIENTE:  { label: 'Pendiente',  className: 'pending' },
  EN_PROCESO: { label: 'En proceso', className: 'inProcess' },
  TERMINADO:  { label: 'Terminado',  className: 'delivered' },
  ENTREGADO:  { label: 'Entregado',  className: 'delivered' },
  CANCELADO:  { label: 'Cancelado',  className: 'delayed' },
};

// ─── Menú de acciones ───
const AccionesMenu = ({ pedidoId, estado }) => {
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) setUpward(true);
        else setUpward(false);
      }
    }, 0);
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(timer);
    };
  }, [open]);

  return (
    <div className={styles.actionsWrapper} ref={ref}>
      <button className={styles.actionBtn} onClick={() => setOpen((o) => !o)}>
        <FiMoreVertical />
      </button>
      {open && (
        <div ref={menuRef} className={`${styles.actionsMenu} ${upward ? styles.actionsUpward : ''}`}>
          <button className={styles.actionItem} onClick={() => setOpen(false)}>
            <FiEye /> Ver
          </button>
          <button className={styles.actionItem} disabled={estado === 'ENTREGADO'} onClick={() => setOpen(false)}>
            <FiXCircle /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ───
const TablaPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [maxPag, setMaxPag] = useState(1);
  const [pagAct, setPagAct] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const fetch = async () => {
      try {
        const resp = await getPedidos(pagAct);
        if (cancel) return;
        setPedidos(resp.data || []);
        setMaxPag(resp.maxPag || 1);
      } catch {
        // silenciar
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetch();
    return () => { cancel = true; };
  }, [pagAct]);

  // Filtro local por búsqueda
  const filtered = pedidos.filter(
    (p) =>
      p.cliente_nombres?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.card}>
      {/* Header: buscador + filtro */}
      <div className={styles.header}>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar cliente o ID..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.filterBtn}><FiFilter /> Filtrar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>CLIENTE</th>
              <th>DESCRIPCIÓN</th>
              <th>FECHA ENTREGA</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingText}>Cargando pedidos…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.loadingText}>No se encontraron pedidos</td></tr>
            ) : (
              filtered.map((row) => {
                const st = statusMap[row.estado?.toUpperCase()] || {};
                const fecha = row.fecha_entrega_estimada || '—';
                const df = row.dias_faltantes;

                let diasClass = '';
                if (df !== null && df !== undefined) {
                  if (df <= 0) diasClass = 'diasRojo';
                  else if (df <= 3) diasClass = 'diasAmarillo';
                }

                return (
                  <tr
                    key={row.id}
                    className={styles.clickableRow}
                    onClick={() => navigate(`/pedidos/${row.id}`)}
                  >
                    <td className={styles.cellId}>{row.id}</td>
                    <td className={styles.cellClient}>{row.cliente_nombres}</td>
                    <td className={styles.cellDesc}>{row.descripcion || '—'}</td>
                    <td className={`${styles.cellDelivery} ${diasClass ? styles[diasClass] : ''}`}>
                      {fecha}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                        {st.label || row.estado}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <AccionesMenu pedidoId={row.id} estado={row.estado} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Vista móvil */}
        <div className={styles.mobileList}>
          {loading ? (
            <p className={styles.loadingText}>Cargando pedidos…</p>
          ) : filtered.length === 0 ? (
            <p className={styles.loadingText}>No se encontraron pedidos</p>
          ) : (
            filtered.map((row) => {
              const st = statusMap[row.estado?.toUpperCase()] || {};
              const fecha = row.fecha_entrega_estimada || '—';
              const df = row.dias_faltantes;
              let diasClass = '';
              if (df !== null && df !== undefined) {
                if (df <= 0) diasClass = 'diasRojo';
                else if (df <= 3) diasClass = 'diasAmarillo';
              }
              return (
                <div key={row.id} className={styles.mobileCard} onClick={() => navigate(`/pedidos/${row.id}`)}>
                  <div className={styles.mobileHeader}>
                    <span className={styles.cellId}>{row.id}</span>
                    <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                      {st.label || row.estado}
                    </span>
                  </div>
                  <p className={styles.mobileClient}>{row.cliente_nombres}</p>
                  <p className={styles.mobileDesc}>{row.descripcion || '—'}</p>
                  <div className={styles.mobileFooter}>
                    <span className={diasClass ? styles[diasClass] : ''}>{fecha}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Paginación */}
      {maxPag > 1 && (
        <div className={styles.footer}>
          <div className={styles.pagination}>
            <FiChevronLeft onClick={() => setPagAct((p) => Math.max(1, p - 1))} />
            {Array.from({ length: maxPag }, (_, i) => i + 1).map((n) => (
              <span key={n} className={n === pagAct ? styles.pageActive : ''} onClick={() => setPagAct(n)}>
                {n}
              </span>
            ))}
            <FiChevronRight onClick={() => setPagAct((p) => Math.min(maxPag, p + 1))} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaPedidos;
