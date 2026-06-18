import React, { useState, useEffect, useCallback } from 'react'
import { formatDate, formatCurrency } from '../../../../utils/format'
import { getClienteById } from '../../services/clientesService'
import { getPedidos } from '../../../pedidos/services/pedidosService'
import './ViewClientModal.css'

const statusMap = {
  PENDIENTE:  { label: 'Pendiente',  className: 'vcm-status--pending' },
  "EN PROCESO": { label: 'En proceso', className: 'vcm-status--process' },
  TERMINADO:  { label: 'Terminado',  className: 'vcm-status--done' },
  ENTREGADO:  { label: 'Entregado',  className: 'vcm-status--done' },
  CANCELADO:  { label: 'Cancelado',  className: 'vcm-status--canceled' },
};

const ViewClientModal = ({ cliente, onClose }) => {
  const [fullCliente, setFullCliente] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cerrar con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (cliente) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [cliente, handleKeyDown])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // ─── Cargar datos del cliente y sus pedidos ───
  useEffect(() => {
    if (!cliente?.id) {
      setLoading(false)
      setOrdersLoading(false)
      return
    }

    const fetchCliente = async () => {
      try {
        const resp = await getClienteById(cliente.id)
        const data = resp?.data || resp || {}
        setFullCliente(data)
      } catch (err) {
        console.warn('[ViewClientModal] Error al cargar cliente:', err?.message)
        setFullCliente(null)
      } finally {
        setLoading(false)
      }
    }

    const fetchOrders = async () => {
      try {
        const clientName = cliente.name || ''
        const resp = await getPedidos(1, { cliente: clientName })
        const data = Array.isArray(resp)
          ? resp
          : resp?.data && Array.isArray(resp.data)
            ? resp.data
            : []
        setOrders(data)
      } catch (err) {
        console.warn('[ViewClientModal] Error al cargar pedidos:', err?.message)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchCliente()
    fetchOrders()
  }, [cliente?.id, cliente?.name])

  if (!cliente) return null

  // Extraer iniciales para el avatar
  const initials = cliente.name
    ?.split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??'

  // Combinar datos: lo que ya teníamos + lo que trajo la API
  const email = fullCliente?.cliente_email || cliente.phone || '—'
  const phone = fullCliente?.cliente_telefono || '—'
  const address = fullCliente?.cliente_direccion || cliente.address || '—'
  const createdAt = fullCliente?.created_at || fullCliente?.fecha_creacion || cliente.lastOrder || null

  return (
    <div className="vcm-overlay" onClick={handleOverlayClick}>
      <div className="vcm-card vcm-card--wide">

        {/* ── Botón cerrar ── */}
        <button className="vcm-close" onClick={onClose} aria-label="Cerrar">
          <i className="ti ti-x" />
        </button>

        <div className="vcm-grid">

          {/* ════════ Columna izquierda: Info del cliente ════════ */}
          <div className="vcm-sidebar">
            <div className="vcm-head">
              <div className="vcm-avatar">
                {initials}
              </div>
              <h2 className="vcm-name">{cliente.name}</h2>
              <span className={`vcm-badge ${cliente.category === 'Activo' ? 'vcm-badge--activo' : 'vcm-badge--inactivo'}`}>
                {cliente.category}
              </span>
            </div>

            <div className="vcm-body">
              <div className="vcm-field">
                <span className="vcm-field__icon">
                  <i className="ti ti-mail" />
                </span>
                <div>
                  <p className="vcm-field__label">Correo electrónico</p>
                  <p className="vcm-field__value">{email}</p>
                </div>
              </div>

              <div className="vcm-field">
                <span className="vcm-field__icon">
                  <i className="ti ti-phone" />
                </span>
                <div>
                  <p className="vcm-field__label">Teléfono</p>
                  <p className="vcm-field__value">{phone}</p>
                </div>
              </div>

              <div className="vcm-field">
                <span className="vcm-field__icon">
                  <i className="ti ti-map-pin" />
                </span>
                <div>
                  <p className="vcm-field__label">Dirección</p>
                  <p className="vcm-field__value">{address}</p>
                </div>
              </div>

              <div className="vcm-field">
                <span className="vcm-field__icon">
                  <i className="ti ti-id" />
                </span>
                <div>
                  <p className="vcm-field__label">ID Cliente</p>
                  <p className="vcm-field__value">{cliente.id || '—'}</p>
                </div>
              </div>

              <div className="vcm-field">
                <span className="vcm-field__icon">
                  <i className="ti ti-calendar" />
                </span>
                <div>
                  <p className="vcm-field__label">Cliente desde</p>
                  <p className="vcm-field__value">
                    {createdAt
                      ? <span className="vcm-fecha">{formatDate(createdAt)}</span>
                      : <span className="vcm-sin-pedido">—</span>
                    }
                  </p>
                </div>
              </div>

              <div className="vcm-field">
                <span className="vcm-field__icon">
                  <i className="ti ti-shopping-bag" />
                </span>
                <div>
                  <p className="vcm-field__label">Total pedidos</p>
                  <p className="vcm-field__value">
                    <span className="vcm-order-count">{orders.length}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="vcm-footer">
              <button className="vcm-btn" onClick={onClose}>
                <i className="ti ti-arrow-left" aria-hidden="true" />
                Volver
              </button>
            </div>
          </div>

          {/* ════════ Columna derecha: Historial de pedidos ════════ */}
          <div className="vcm-orders">
            <div className="vcm-orders-header">
              <h3 className="vcm-orders-title">Historial de pedidos</h3>
              {!ordersLoading && (
                <span className="vcm-orders-count">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {ordersLoading ? (
              <div className="vcm-orders-empty">
                <i className="ti ti-loader ti-spin" />
                <span>Cargando pedidos…</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="vcm-orders-empty">
                <i className="ti ti-shopping-bag-off" />
                <span>No tiene pedidos registrados</span>
              </div>
            ) : (
              <div className="vcm-orders-list">
                <table className="vcm-orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const st = statusMap[order.estado?.toUpperCase()] || {};
                      return (
                        <tr key={order.id} className="vcm-order-row">
                          <td className="vcm-order-id">{order.id}</td>
                          <td className="vcm-order-date">
                            {order.fecha_creacion ? formatDate(order.fecha_creacion) : '—'}
                          </td>
                          <td>
                            <span className={`vcm-status-badge ${st.className || ''}`}>
                              {st.label || order.estado || '—'}
                            </span>
                          </td>
                          <td className="vcm-order-total">
                            {order.total ? formatCurrency(order.total) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ViewClientModal
