import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegistrarPagoPedido from '../../components/RegistrarPagoPedido'
import styles from './pedidos.module.css'

const PEDIDOS = [
  { id: 1, pedido_id: 'PED-001', cliente: 'María García López', descripcion: 'Vestido de Noche Seda — Talla M', total: 520000, estado: 'Entregado', fecha: '2025-01-20' },
  { id: 2, pedido_id: 'PED-002', cliente: 'Carlos Mendoza Paz', descripcion: 'Traje Lino Crudo — Talla 42', total: 680000, estado: 'Terminado', fecha: '2025-02-01' },
  { id: 3, pedido_id: 'PED-003', cliente: 'Alejandro Martínez Ruiz', descripcion: 'Blazer Lino Clásico — Talla L', total: 345000, estado: 'En proceso', fecha: '2025-02-05' },
  { id: 4, pedido_id: 'PED-004', cliente: 'Ana Restrepo Gil', descripcion: 'Vestido de Día Lino + Chaqueta', total: 420000, estado: 'Pendiente', fecha: '2025-02-10' },
  { id: 5, pedido_id: 'PED-005', cliente: 'Pedro Jiménez Londoño', descripcion: 'Corbata Terciopelo + Pañuelo Seda', total: 185000, estado: 'Cancelado', fecha: '2025-02-08' },
  { id: 6, pedido_id: 'PED-006', cliente: 'Laura Jiménez Torres', descripcion: 'Pañuelo Seda Tussar', total: 140000, estado: 'Terminado', fecha: '2025-02-12' },
]

const estadoBadge = {
  'Pendiente': 'pending',
  'En proceso': 'process',
  'Terminado': 'done',
  'Entregado': 'delivered',
  'Cancelado': 'cancelled',
}

const PedidosPage = () => {
  const navigate = useNavigate()
  const [estadoFilter, setEstadoFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = PEDIDOS.filter((p) => {
    if (estadoFilter && p.estado !== estadoFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.cliente.toLowerCase().includes(q) && !p.pedido_id.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPedidos = PEDIDOS.length
  const enProceso = PEDIDOS.filter((p) => p.estado === 'En proceso' || p.estado === 'Pendiente').length
  const terminados = PEDIDOS.filter((p) => p.estado === 'Terminado').length
  const totalVenta = PEDIDOS.reduce((s, p) => s + p.total, 0)

  const fmt = (val) =>
    Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  return (
    <div className={styles.pedContent}>
      <div className={styles.pedHeader}>
        <div>
          <h1 className={styles.pedTitle}>Pedidos</h1>
          <p className={styles.pedSubtitle}>Lista completa de pedidos recibidos. Da clic para ver el detalle.</p>
        </div>
        <button className={styles.pedBtnPrimary} onClick={() => navigate('/pedidos')}>
          <i className="ti ti-plus" aria-hidden="true" /> Nuevo Pedido
        </button>
      </div>

      <div className={styles.pedStats}>
        <div className={styles.pedStatCard}>
          <div className={`${styles.pedStatIcon} ${styles['pedStatIcon--blue']}`}><i className="ti ti-shopping-cart" /></div>
          <div><p className={styles.pedStatValue}>{totalPedidos}</p><p className={styles.pedStatLabel}>Total Pedidos</p></div>
        </div>
        <div className={styles.pedStatCard}>
          <div className={`${styles.pedStatIcon} ${styles['pedStatIcon--orange']}`}><i className="ti ti-clock" /></div>
          <div><p className={styles.pedStatValue}>{enProceso}</p><p className={styles.pedStatLabel}>En proceso / Pendientes</p></div>
        </div>
        <div className={styles.pedStatCard}>
          <div className={`${styles.pedStatIcon} ${styles['pedStatIcon--green']}`}><i className="ti ti-circle-check" /></div>
          <div><p className={styles.pedStatValue}>{terminados}</p><p className={styles.pedStatLabel}>Terminados / Entregados</p></div>
        </div>
        <div className={styles.pedStatCard}>
          <div className={`${styles.pedStatIcon} ${styles['pedStatIcon--purple']}`}><i className="ti ti-coin" /></div>
          <div><p className={styles.pedStatValue}>{fmt(totalVenta)}</p><p className={styles.pedStatLabel}>Valor Total</p></div>
        </div>
      </div>

      <div className={styles.pedFilters}>
        <div className={styles.pedFilters__left}>
          <select className={styles.pedSelect} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
            <option value="">Estado: Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Terminado">Terminado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <div className={styles.pedSearch}>
            <i className="ti ti-search" />
            <input type="text" placeholder="Buscar cliente o pedido..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <p className={styles.pedFilters__count}>Showing {filtered.length} pedidos</p>
      </div>

      <div className={styles.pedTableWrap}>
        <table className={styles.pedTable}>
          <thead>
            <tr>
              <th>N° Pedido</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className={styles.pedCellId}>{p.pedido_id}</td>
                <td>
                  <div className={styles.pedCellCliente}>
                    <p className={styles.pedClienteName}>{p.cliente}</p>
                    <p className={styles.pedClienteDesc}>{p.descripcion}</p>
                  </div>
                </td>
                <td className={styles.pedCellTotal}>{fmt(p.total)}</td>
                <td className={styles.pedCellFecha}>{p.fecha}</td>
                <td>
                  <span className={`${styles.pedEstadoBadge} ${styles[`pedEstadoBadge--${estadoBadge[p.estado] || 'pending'}`]}`}>
                    {p.estado}
                  </span>
                </td>
                <td>
                  <div className={styles.pedActions}>
                    <button className={styles.pedActionBtn} title="Ver detalle" onClick={() => navigate(`/pedidos/${p.pedido_id}`)}>
                      <i className="ti ti-eye" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className={styles.pedEmpty}>No se encontraron pedidos.</p>}
      </div>

      {/* ══ DRAWER DE PAGO ══ */}
      {pedidoCobrar && (
        <RegistrarPagoPedido
          isOpen={!!pedidoCobrar}
          onClose={() => setPedidoCobrar(null)}
          pedido={pedidoCobrar}
        />
      )}
    </div>
  )
}

export default PedidosPage
