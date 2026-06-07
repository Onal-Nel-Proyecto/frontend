import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import NewClientPanel   from '../page/RegisterClient'
import ContactTable     from '../components/table/ContactTable'
import { useClientes }  from '../hooks/useClientes'
import ViewClientModal   from '../components/ui/feedback/ViewClientModal/ViewClientModal'
import './ClientDirectory.css'

const ClientDirectory = () => {
  const location = useLocation();
  const [showRegister, setShowRegister] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)

  useEffect(() => {
    if (location.state?.openForm) {
      setShowRegister(true);
      window.history.replaceState(null, '');
    }
  }, []);
  const [clienteViendo, setClienteViendo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredClientes = clientes.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    )
  })

  // ── VER ─────────────────────────────────
  const handleViewCliente = (cliente) => {
    setClienteViendo(cliente)
  }

  // ── EDITAR ──────────────────────────────
  const handleEditCliente = (cliente) => {
    setClienteEditando(cliente)
    setShowRegister(true)
  }

  const handleClienteActualizado = async (clienteData) => {
    const result = await editCliente(clienteEditando.id, clienteData)
    if (result.ok) {
      setShowRegister(false)
      setClienteEditando(null)
    }
    return result
  }

  // ── ELIMINAR ────────────────────────────
  const handleDeleteCliente = (cliente) => {
    if (window.confirm(`¿Eliminar a "${cliente.name}"?`)) {
      deleteCliente(cliente.id)
    }
  }

  // ── CREAR ───────────────────────────────
  const handleClienteCreado = async (clienteData) => {
    const result = await addCliente(clienteData)
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

      {/* Buscador simple */}
      <div className="cd-search">
        <i className="ti ti-search" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="cd-search-count">
          {filteredClientes.length} de {clientes.length} clientes
        </span>
      </div>

      {/* Indicador de carga / error */}
      {loading && (
        <div className="cd-loading">
          <i className="ti ti-loader ti-spin" aria-hidden="true" />
          {' '}Cargando clientes…
        </div>
      )}

      {error && (
        <div className="cd-error">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {' '}{error}
        </div>
      )}

      {/* Tabla */}
      <div className="cd-table-section">
        <ContactTable
          clients={filteredClientes}
          onView={handleViewCliente}
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
          totalClientes={filteredClientes.length}
        />
      </div>

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

    </div>
  )
}

export default ClientDirectory
