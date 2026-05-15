// ================================================================
// TablaPedidos — Tabla del listado completo de pedidos
// Diseño moderno, minimalista, responsive.
// Incluye: búsqueda, filtro, tabla con badges, paginación,
// menú de acciones por fila (Ver / Cancelar).
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
import styles from './TablaPedidos.module.css';

// ─── Datos de ejemplo ───

const pedidosEjemplo = [
  { id: '#ON-4829', client: 'Luxe Living Interiors',   description: 'Silk Velvet Cushions - Ochre',   quantity: 45, delivery: 'Oct 24, 2023', status: 'EN_PROCESO' },
  { id: '#ON-4830', client: 'Maison de Lin',           description: 'Linen Table Runners',            quantity: 120, delivery: 'Oct 18, 2023', status: 'CANCELADO' },
  { id: '#ON-4831', client: 'Artisan Weave Co.',        description: 'Wool Throw Blankets',           quantity: 60,  delivery: 'Nov 02, 2023', status: 'PENDIENTE' },
  { id: '#ON-4832', client: 'Urban Texture Studio',     description: 'Cotton Duvet Covers - Beige',   quantity: 30,  delivery: 'Oct 10, 2023', status: 'ENTREGADO' },
  { id: '#ON-4833', client: 'Eco Home Goods',           description: 'Bamboo Fiber Sheets - Queen',   quantity: 85,  delivery: 'Oct 28, 2023', status: 'EN_PROCESO' },
  { id: '#ON-4834', client: 'Heritage Linens Ltd.',     description: 'Embroidered Napkins Set',        quantity: 200, delivery: 'Nov 15, 2023', status: 'PENDIENTE' },
  { id: '#ON-4835', client: 'Modern Drapes Inc.',       description: 'Blackout Curtains - Charcoal',  quantity: 50,  delivery: 'Oct 05, 2023', status: 'CANCELADO' },
];

const statusConfig = {
  EN_PROCESO: { label: 'En proceso',  className: 'inProcess' },
  TERMINADO:  { label: 'Terminado',   className: 'delivered' },
  PENDIENTE:  { label: 'Pendiente',   className: 'pending' },
  CANCELADO:  { label: 'Cancelado',   className: 'delayed' },
  ENTREGADO:  { label: 'Entregado',   className: 'delivered' },
};

// ─── Menú de acciones por fila ───

const AccionesMenu = ({ pedidoId }) => {
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Detectar si el menú desborda la ventana → abrir hacia arriba
    const timer = setTimeout(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
          setUpward(true);
        } else {
          setUpward(false);
        }
      }
    }, 0);

    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
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
        <div
          ref={menuRef}
          className={`${styles.actionsMenu} ${upward ? styles.actionsUpward : ''}`}
        >
          <button className={styles.actionItem} onClick={() => { setOpen(false); /* ver */ }}>
            <FiEye /> Ver
          </button>
          <button className={styles.actionItem} onClick={() => { setOpen(false); /* cancelar */ }}>
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
  const [search, setSearch] = useState('');

  const filtered = pedidosEjemplo.filter(
    (p) =>
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.card}>
      {/* ── Header: buscador + filtro ── */}
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
          <button className={styles.filterBtn}>
            <FiFilter />
            Filtrar
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>CLIENTE</th>
              <th>DESCRIPCIÓN</th>
              <th>CANTIDAD</th>
              <th>FECHA ENTREGA</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const st = statusConfig[row.status] || {};
              return (
                <tr key={row.id} className={styles.clickableRow} onClick={() => navigate(`/pedidos/${row.id}`)}>
                  <td className={styles.cellId}>{row.id}</td>
                  <td className={styles.cellClient}>{row.client}</td>
                  <td className={styles.cellDesc}>{row.description}</td>
                  <td className={styles.cellQty}>{row.quantity}</td>
                  <td className={`${styles.cellDelivery} ${row.status === 'CANCELADO' ? styles.delayedText : ''}`}>
                    {row.delivery}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                      {st.label || row.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <AccionesMenu pedidoId={row.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Vista móvil: cards apiladas */}
        <div className={styles.mobileList}>
          {filtered.map((row) => {
            const st = statusConfig[row.status] || {};
            return (
              <div key={row.id} className={styles.mobileCard} onClick={() => navigate(`/pedidos/${row.id}`)}>
                <div className={styles.mobileHeader}>
                  <span className={styles.cellId}>{row.id}</span>
                  <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                    {st.label || row.status}
                  </span>
                </div>
                <p className={styles.mobileClient}>{row.client}</p>
                <p className={styles.mobileDesc}>{row.description}</p>
                <div className={styles.mobileFooter}>
                  <span>{row.quantity} uds</span>
                  <span className={row.status === 'CANCELADO' ? styles.delayedText : ''}>
                    {row.delivery}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Paginación ── */}
      <div className={styles.footer}>
        <div className={styles.pagination}>
          <FiChevronLeft />
          <span className={styles.pageActive}>1</span>
          <span>2</span>
          <span>3</span>
          <FiChevronRight />
        </div>
      </div>
    </div>
  );
};

export default TablaPedidos;
