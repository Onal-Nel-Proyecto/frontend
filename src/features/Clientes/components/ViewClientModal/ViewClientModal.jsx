import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const navigate = useNavigate()

  // Formatear teléfonos desde el array de la API
  const formatPhones = (telefonos) => {
    if (!telefonos || !Array.isArray(telefonos) || telefonos.length === 0) return cliente.phone || '—'
    return telefonos
      .map((t) => (typeof t === "string" ? t : t.numero_telefono || t.numero || t.telefono || ''))
      .filter(Boolean)
      .join(', ')
  }

  // Combinar datos: lo que ya teníamos + lo que trajo la API
  const email = fullCliente?.cliente_email || cliente.email || '—'
  const phone = formatPhones(fullCliente?.cliente_telefonos)
  const address = fullCliente?.cliente_direccion || cliente.address || '—'
  const createdAt = fullCliente?.created_at || fullCliente?.fecha_creacion || cliente.lastOrder || null

  return (
    <div className="vcm-overlay" onClick={handleOverlayClick}>
      <div className="vcm-card vcm-card--wide">



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
                {orders.map((order) => {
                  const st = statusMap[order.estado?.toUpperCase()] || {};

                  // Tipos de prenda: desde campo directo o desde detalles
                  const tiposPrendaRaw = order.tipos_prenda
                  let tiposPrenda = Array.isArray(tiposPrendaRaw)
                    ? tiposPrendaRaw.filter(Boolean)
                    : typeof tiposPrendaRaw === 'string'
                      ? tiposPrendaRaw.split(',').map(s => s.trim()).filter(Boolean)
                      : []
                  if (tiposPrenda.length === 0) {
                    const prendas = (order.detalles || [])
                      .map(d => d?.producto?.tipoPrenda || d?.producto?.tipo_prenda || '')
                      .filter(Boolean)
                    tiposPrenda = [...new Set(prendas)]
                  }

                  // Observacion
                  const observacion = order.observacion || ''

                  // Fecha: priorizar fecha_entrega, luego fecha_entrega_estimada
                  const fecha = order.fecha_entrega || order.fecha_entrega_estimada || order.fecha_creacion || ''

                  return (
                    <div key={order.id} className="vcm-order-item" onClick={() => navigate(`/pedidos/${order.id}`)}>
                      <div className="vcm-order-item__head">
                        <span className="vcm-order-item__id">#{order.id}</span>
                        <span className={`vcm-status-badge ${st.className || ''}`}>
                          {st.label || order.estado || '—'}
                        </span>
                      </div>
                      <div className="vcm-order-item__body">
                        <div className="vcm-order-item__field">
                          <span className="vcm-order-item__label">Fecha</span>
                          <span className="vcm-order-item__value">
                            {fecha ? formatDate(fecha) : '—'}
                          </span>
                        </div>
                        <div className="vcm-order-item__field">
                          <span className="vcm-order-item__label">Total</span>
                          <span className="vcm-order-item__value vcm-order-item__value--total">
                            {order.precio_total || order.total ? formatCurrency(order.precio_total || order.total) : '—'}
                          </span>
                        </div>
                        {tiposPrenda.length > 0 && (
                          <div className="vcm-order-item__field vcm-order-item__field--full">
                            <span className="vcm-order-item__label">Tipo de prendas</span>
                            <div className="vcm-order-item__tags">
                              {tiposPrenda.map((t, i) => (
                                <span key={i} className="vcm-order-tag">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="vcm-order-item__field vcm-order-item__field--full vcm-order-item__field--obs">
                          <span className="vcm-order-item__label">Observación</span>
                          <p className={`vcm-order-item__obs${!observacion ? ' vcm-order-item__obs--empty' : ''}`}>{observacion || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default ViewClientModal
