import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import NewClientPanel   from '../page/RegisterClient'
import StatCard         from '../components/stats/StatCard'
import GrowthCard       from '../components/stats/GrowthCard'
import TableFilters     from '../components/table/TableFilters'
import ContactTable     from '../components/table/ContactTable'
import MaintenanceCard  from '../components/cards/MaintenanceCard'
import InsightsCard     from '../components/cards/InsightsCard'
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

  const handleFilterChange = (filters) => {
    console.log('Filtros activos:', filters)
  }

  const handleExport = () => {
    console.log('Exportando clientes...')
  }

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

      {/* Grid de estadísticas */}
      <div className="stats-grid">
        <StatCard
          icon="ti-users"
          label="Total Clientes"
          value={meta?.total ?? 0}
        />
        <StatCard
          icon="ti-star"
          label="Clientes VIP"
          value={48}
          highlight
        />
        <StatCard
          icon="ti-shopping-cart"
          label="Pedidos Activos"
          value={127}
        />
        <GrowthCard
          percentage="+12.4%"
          period="Crecimiento Mensual"
          description="Continúas expandiendo tu presencia en el mercado de alta costura este trimestre."
        />
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

      {/* Sección tabla */}
      <div className="table-section">
        <TableFilters
          onFilterChange={handleFilterChange}
          onExport={handleExport}
        />
        <ContactTable
          clients={clientes}
          onView={handleViewCliente}
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
          totalClientes={meta?.total}
        />
      </div>

      {/* Fila inferior de cards */}
      <div className="bottom-row">
        <MaintenanceCard
          onCta={() => console.log('Configurar alertas')}
        />
        <InsightsCard
          onCta={() => console.log('Ver reporte')}
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
