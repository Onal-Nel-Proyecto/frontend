import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import NewClientPanel   from '../page/RegisterClient'
import ContactTable     from '../components/table/ContactTable'
import { useClientes }  from '../hooks/useClientes'
import ViewClientModal   from '../components/ui/feedback/ViewClientModal/ViewClientModal'
import Alert from '../components/ui/feedback/Alert'
import { changeStatus } from '../api/clientesService'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './ClientDirectory.css'

// ── Generar números de página para paginación inteligente ──
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  let start = Math.max(2, current - 1)
  let end = Math.min(total - 1, current + 1)
  if (current <= 2) end = 3
  if (current >= total - 1) start = total - 2
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
}

const LIMITE = 15

const ClientDirectory = () => {
  const location = useLocation()
  const [showRegister, setShowRegister] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)

  useEffect(() => {
    if (location.state?.openForm) {
      setShowRegister(true)
      window.history.replaceState(null, '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [clienteViendo, setClienteViendo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [alert, setAlert] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const isFirstRender = useRef(true)
  const debounceRef = useRef(null)

  const {
    clientes,
    meta,
    loading,
    error,
    loadClientes,
    addCliente,
    editCliente,
    deleteCliente,
  } = useClientes()

  // ── Búsqueda con debounce (server-side) ───────────────
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPaginaActual(1)
    }, 400)
  }

  // ── Sincronizar página / búsqueda con la API ─────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    loadClientes(paginaActual, LIMITE, debouncedSearch)
  }, [paginaActual, debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Números de página ─────────────────────────────────
  const pageNumbers = useMemo(
    () => getPageNumbers(paginaActual, meta?.paginas_totales || 1),
    [paginaActual, meta?.paginas_totales],
  )

  // ── Cambiar de página ─────────────────────────────────
  const handlePageChange = (page) => {
    if (page < 1 || page > (meta?.paginas_totales || 1)) return
    setPaginaActual(page)
  }

  // ── VER ───────────────────────────────────────────────
  const handleViewCliente = (cliente) => {
    setClienteViendo(cliente)
  }

  // ── EDITAR ────────────────────────────────────────────
  const handleEditCliente = (cliente) => {
    setClienteEditando(cliente)
    setShowRegister(true)
  }

  const handleClienteActualizado = async (clienteData) => {
    const result = await editCliente(clienteEditando.id, clienteData, debouncedSearch)
    if (result.ok) {
      setShowRegister(false)
      setClienteEditando(null)
    }
    return result
  }

  // ── INHABILITAR ───────────────────────────────────────
  const handleDeleteCliente = (cliente) => {
    setConfirmTarget(cliente)
  }

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return
    const result = await deleteCliente(confirmTarget.id, debouncedSearch)
    setConfirmTarget(null)
    if (result?.msg) {
      setAlert({
        type: 'success',
        title: 'Cliente inhabilitado',
        message: result.msg,
        onClose: () => setAlert(null),
      })
    }
  }

  // ── REACTIVAR ─────────────────────────────────────────
  const handleReactivateCliente = async (cliente) => {
    try {
      const response = await changeStatus(cliente.id, 1)
      setAlert({
        type: 'success',
        title: 'Cliente reactivado',
        message: response?.msg || `${cliente.name} ahora está activo.`,
        onClose: () => setAlert(null),
      })
      loadClientes(paginaActual, LIMITE, debouncedSearch)
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.message || 'No se pudo reactivar el cliente',
        onClose: () => setAlert(null),
      })
    }
  }

  // ── CREAR ─────────────────────────────────────────────
  const handleClienteCreado = async (clienteData) => {
    const result = await addCliente(clienteData, debouncedSearch)
    if (result.ok) {
      setShowRegister(false)
    }
    return result
  }

  const cerrarPanel = () => {
    setShowRegister(false)
    setClienteEditando(null)
  }

  return (
    <div className="cd-content">

      {/* Encabezado de página */}
      <div className="cd-header">
        <div>
          <h1 className="cd-title">Directorio de Clientes</h1>
          <p className="cd-subtitle">
            Gestiona tu base de datos de clientes para agilizar
            el proceso de pedidos personalizados y seguimiento de confección.
          </p>
        </div>
        <button
          className="cd-btn-primary"
          onClick={() => setShowRegister(true)}
        >
          <i className="ti ti-user-plus" aria-hidden="true" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="cd-search">
        <i className="ti ti-search" />
        <input
          type="text"
          placeholder="Buscar cliente por nombres, apellidos o id..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <span className="cd-search-count">
          {clientes.length} clientes
        </span>
      </div>

      {/* Indicador de carga — solo en primera carga */}
      {loading && clientes.length === 0 && (
        <div className="cd-loading">
          <i className="ti ti-loader ti-spin" aria-hidden="true" />
          {' '}Cargando clientes…
        </div>
      )}

      {error && !loading && (
        <div className="cd-error">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {' '}{error}
        </div>
      )}

      {/* Tabla */}
      <div className="cd-table-section">
        <ContactTable
          clients={clientes}
          onView={handleViewCliente}
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
          onReactivate={handleReactivateCliente}
          totalClientes={clientes.length}
        />
      </div>

      {/* Paginación */}
      {meta?.paginas_totales > 1 && (
        <div className="cd-pagination">
          <FiChevronLeft
            className={`cd-page-arrow${paginaActual <= 1 ? ' cd-page-arrow--disabled' : ''}`}
            onClick={() => handlePageChange(paginaActual - 1)}
          />
          {pageNumbers.map((n, i) =>
            n === '...' ? (
              <span key={`ellipsis-${i}`} className="cd-page-ellipsis">…</span>
            ) : (
              <span
                key={n}
                className={`cd-page-num${n === paginaActual ? ' cd-page-num--active' : ''}`}
                onClick={() => handlePageChange(n)}
              >
                {n}
              </span>
            ),
          )}
          <FiChevronRight
            className={`cd-page-arrow${paginaActual >= (meta?.paginas_totales || 1) ? ' cd-page-arrow--disabled' : ''}`}
            onClick={() => handlePageChange(paginaActual + 1)}
          />
        </div>
      )}

      {/* Modal de detalle */}
      {clienteViendo && (
        <ViewClientModal
          cliente={clienteViendo}
          onClose={() => setClienteViendo(null)}
        />
      )}

      {/* Drawer de registro / edición */}
      {showRegister && (
        <NewClientPanel
          isOpen={showRegister}
          onClose={cerrarPanel}
          onGuardar={clienteEditando ? handleClienteActualizado : handleClienteCreado}
          clienteEdit={clienteEditando}
        />
      )}

      {confirmTarget && (
        <Alert
          type="confirm"
          title="Inhabilitar cliente"
          message={`¿Estás seguro de inhabilitar a "${confirmTarget.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={alert.onClose}
        />
      )}
    </div>
  )
}

export default ClientDirectory
