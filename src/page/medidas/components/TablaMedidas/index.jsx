// ================================================================
// TablaMedidas — Tabla del listado de medidas
// ================================================================

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiToggleLeft,
  FiToggleRight,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { getMedidas, changeMedidaStatus, deleteMedida } from '../../../../services/medidasService';
import styles from './TablaMedidas.module.css';

const statusMap = {
  ACTIVO:  { label: 'Activo',  className: 'active' },
  INACTIVO: { label: 'Inactivo', className: 'inactive' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 2) end = 3;
  if (current >= total - 1) start = total - 2;

  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');

  pages.push(total);
  return pages;
};

// ─── Menú de acciones por fila ───
const AccionesMenu = ({ medida, onEditar, onCambiarEstado }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open || !menuRef.current || !coords) return;
    const rect = menuRef.current.getBoundingClientRect();
    let { top, left } = coords;

    if (rect.bottom > window.innerHeight - 8) {
      const btnRect = btnRef.current?.getBoundingClientRect();
      top = btnRect ? btnRect.top - rect.height - 4 : top - rect.height - 4;
    }
    if (top < 8) {
      const btnRect = btnRef.current?.getBoundingClientRect();
      top = btnRect ? btnRect.bottom + 4 : 8;
    }
    if (rect.right > window.innerWidth - 8) {
      const btnRect = btnRef.current?.getBoundingClientRect();
      left = btnRect ? btnRect.right - 150 : left;
    }
    if (left < 8) left = 8;

    if (top !== coords.top || left !== coords.left) {
      setCoords({ top, left });
    }
  }, [open, coords]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 150;
      let left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      if (left < 8) left = 8;

      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedMenuH = 100;
      const top = spaceBelow >= estimatedMenuH
        ? rect.bottom + 4
        : rect.top - estimatedMenuH - 4;

      setCoords({ top, left });
    }
    setOpen((o) => !o);
  };

  return (
    <div className={styles.actionsWrapper} ref={btnRef}>
      <button className={styles.actionBtn} onClick={handleToggle}>
        <FiMoreVertical />
      </button>
      {open && coords && createPortal(
        <div
          ref={menuRef}
          className={styles.actionsMenuPortal}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 1050,
          }}
        >
          <button className={styles.actionItem} onClick={() => { setOpen(false); onEditar(); }}>
            <FiEdit2 /> Editar
          </button>
          <button className={styles.actionItem} onClick={() => { setOpen(false); onCambiarEstado(); }}>
            {(medida.med_est || medida.estado) === 'ACTIVO' ? (
              <><FiToggleLeft /> Inactivar</>
            ) : (
              <><FiToggleRight /> Activar</>
            )}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Componente principal ───
const TablaMedidas = ({ onEditar }) => {
  const [medidas, setMedidas] = useState([]);
  const [maxPag, setMaxPag] = useState(1);
  const [pagAct, setPagAct] = useState(1);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(true);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  useEffect(() => {
    let cancel = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const filtros = {};
        if (filtroEstado) filtros.estado = filtroEstado;
        const resp = await getMedidas(pagAct, filtros);
        if (cancel) return;
        setMedidas(resp.data || []);
        setMaxPag(resp.maxPag || 1);
      } catch {
        // silenciar
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetch();
    return () => { cancel = true; };
  }, [pagAct, filtroEstado]);

  const filtered = medidas.filter(
    (m) =>
      (m.med_nom || m.nombre || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (m.med_desc || m.descripcion || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (m.med_tipo || m.tipo_medida || '')?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;
    const id = statusTarget.med_id || statusTarget.id;
    const nuevoEstado = (statusTarget.med_est || statusTarget.estado) === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setStatusTarget(null);
    setStatusLoading(true);
    try {
      const resp = await changeMedidaStatus(id, { estado: nuevoEstado });
      setStatusLoading(false);
      if (resp?.status) {
        setStatusResult({
          type: 'success',
          title: 'Estado actualizado',
          message: resp.msg || `Medida ${nuevoEstado === 'ACTIVO' ? 'activada' : 'inactivada'} correctamente`,
          onClose: () => { setStatusResult(null); window.location.reload(); },
        });
      } else {
        setStatusResult({
          type: 'error',
          title: 'Error',
          message: resp?.msg || 'Error al cambiar el estado',
          onClose: () => setStatusResult(null),
        });
      }
    } catch (err) {
      setStatusLoading(false);
      setStatusResult({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo cambiar el estado',
        onClose: () => setStatusResult(null),
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.med_id || deleteTarget.id;
    setDeleteTarget(null);
    setDeleteLoading(true);
    try {
      const resp = await deleteMedida(id);
      setDeleteLoading(false);
      if (resp?.status) {
        setDeleteResult({
          type: 'success',
          title: 'Medida eliminada',
          message: resp.msg || 'Medida eliminada correctamente',
          onClose: () => { setDeleteResult(null); window.location.reload(); },
        });
      } else {
        setDeleteResult({
          type: 'error',
          title: 'Error',
          message: resp?.msg || 'Error al eliminar la medida',
          onClose: () => setDeleteResult(null),
        });
      }
    } catch (err) {
      setDeleteLoading(false);
      setDeleteResult({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo eliminar la medida',
        onClose: () => setDeleteResult(null),
      });
    }
  };

  return (
    <div className={styles.card}>
      {/* Header con búsqueda y filtro por estado */}
      <div className={styles.header}>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={200}
            />
          </div>
          <select
            className={styles.statusSelect}
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPagAct(1); }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla escritorio */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>NOMBRE</th>
              <th>DESCRIPCIÓN</th>
              <th>TIPO</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loadingText}>Cargando medidas…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.loadingText}>No se encontraron medidas</td></tr>
            ) : (
              filtered.map((row) => {
                const st = statusMap[row.med_est || row.estado] || {};
                return (
                  <tr key={row.med_id || row.id}>
                    <td className={styles.cellId}>{row.med_id || row.id}</td>
                    <td className={styles.cellName}>{row.med_nom || row.nombre}</td>
                    <td className={styles.cellDesc}>{row.med_desc || row.descripcion || '—'}</td>
                    <td className={styles.cellTipo}>{row.med_tipo || row.tipo_medida || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                        {st.label || row.med_est || row.estado}
                      </span>
                    </td>
                    <td>
                      <AccionesMenu
                        medida={row}
                        onEditar={() => onEditar(row)}
                        onCambiarEstado={() => setStatusTarget(row)}
                      />
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
            <p className={styles.loadingText}>Cargando medidas…</p>
          ) : filtered.length === 0 ? (
            <p className={styles.loadingText}>No se encontraron medidas</p>
          ) : (
            filtered.map((row) => {
              const st = statusMap[row.med_est || row.estado] || {};
              return (
                <div key={row.med_id || row.id} className={styles.mobileCard}>
                  <div className={styles.mobileHeader}>
                    <span className={styles.cellId}>{row.med_id || row.id}</span>
                    <span className={`${styles.badge} ${styles[st.className] || ''}`}>
                      {st.label || row.med_est || row.estado}
                    </span>
                  </div>
                  <p className={styles.mobileName}>{row.med_nom || row.nombre}</p>
                  <p className={styles.mobileDesc}>{row.med_desc || row.descripcion || '—'}</p>
                  <p className={styles.mobileTipo}><strong>Tipo:</strong> {row.med_tipo || row.tipo_medida || '—'}</p>
                  <div className={styles.mobileActions}>
                    <button className={styles.mobileActionBtn} onClick={() => onEditar(row)}>
                      <FiEdit2 /> Editar
                    </button>
                    <button className={styles.mobileActionBtn} onClick={() => setStatusTarget(row)}>
                      {(row.med_est || row.estado) === 'ACTIVO' ? (
                        <><FiToggleLeft /> Inactivar</>
                      ) : (
                        <><FiToggleRight /> Activar</>
                      )}
                    </button>
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
            <FiChevronLeft
              className={`${styles.pageArrow} ${pagAct <= 1 ? styles.pageArrowDisabled : ''}`}
              onClick={() => pagAct > 1 && setPagAct((p) => p - 1)}
            />
            {getPageNumbers(pagAct, maxPag).map((n, i) =>
              n === '...' ? (
                <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
              ) : (
                <span
                  key={n}
                  className={n === pagAct ? styles.pageActive : ''}
                  onClick={() => setPagAct(n)}
                >{n}</span>
              )
            )}
            <FiChevronRight
              className={`${styles.pageArrow} ${pagAct >= maxPag ? styles.pageArrowDisabled : ''}`}
              onClick={() => pagAct < maxPag && setPagAct((p) => p + 1)}
            />
          </div>
        </div>
      )}

      {/* Confirmación cambio de estado */}
      {statusTarget && (
        <Alert
          type="confirm"
          title={(statusTarget.med_est || statusTarget.estado) === 'ACTIVO' ? '¿Inactivar medida?' : '¿Activar medida?'}
          message={`¿Estás seguro de ${(statusTarget.med_est || statusTarget.estado) === 'ACTIVO' ? 'inactivar' : 'activar'} la medida "${statusTarget.med_nom || statusTarget.nombre}"?`}
          onCancel={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
        />
      )}

      {statusLoading && <LoadingOverlay title="Cambiando estado…" message="Procesando la solicitud" />}
      {statusResult && (
        <Alert type={statusResult.type} title={statusResult.title} message={statusResult.message} onClose={statusResult.onClose} />
      )}

      {/* Confirmación eliminación */}
      {deleteTarget && (
        <Alert
          type="confirm"
          title="¿Eliminar medida?"
          message={`¿Estás seguro de eliminar la medida "${deleteTarget.med_nom || deleteTarget.nombre}"? Esta acción no se puede deshacer.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {deleteLoading && <LoadingOverlay title="Eliminando medida…" message="Procesando la solicitud" />}
      {deleteResult && (
        <Alert type={deleteResult.type} title={deleteResult.title} message={deleteResult.message} onClose={deleteResult.onClose} />
      )}
    </div>
  );
};

export default TablaMedidas;
