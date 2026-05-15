import React, { useState } from 'react'
import NewClientPanel   from '../page/RegisterClient'
import StatCard         from '../components/stats/StatCard'
import GrowthCard       from '../components/stats/GrowthCard'
import TableFilters     from '../components/table/TableFilters'
import ContactTable     from '../components/table/ContactTable'
import MaintenanceCard  from '../components/cards/MaintenanceCard'
import InsightsCard     from '../components/cards/InsightsCard'
import './ClientDirectory.css'

// Datos de ejemplo (en producción vendrían de una API)
const MOCK_CLIENTS = [
  {
    id: 1,
    name:     'Luxe Living Interiors',
    category: 'Interiorismo Premium',
    phone:    '+34 912 345 678',
    address:  'Calle de Velázquez, 45, Madrid',
    lastOrder: 'Oct 24, 2023',
  },
  {
    id: 2,
    name:     'Maison de Lin',
    category: 'Boutique de Textiles',
    phone:    '+34 931 889 221',
    address:  'Passeig de Gràcia, 12, Barcelona',
    lastOrder: 'Oct 18, 2023',
  },
  {
    id: 3,
    name:     'Studio Bloom',
    category: 'Diseño de Eventos',
    phone:    '+34 954 112 334',
    address:  'Avenida de la Palmera, 89, Sevilla',
    lastOrder: null,
  },
  {
    id: 4,
    name:     'The Heritage Hotel',
    category: 'Hostelería Gran Lujo',
    phone:    '+34 910 001 002',
    address:  'Plaza de la Independencia, 1, Madrid',
    lastOrder: 'Nov 02, 2023',
  },
]

const ClientDirectory = () => {
  const [showRegister, setShowRegister] = useState(false)
  const [clients, setClients]           = useState(MOCK_CLIENTS)

  const handleFilterChange = (filters) => {
    // Aquí conectarías con tu API para filtrar
    console.log('Filtros activos:', filters)
  }

  const handleExport = () => {
    // Lógica de exportación CSV / Excel
    console.log('Exportando clientes...')
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
          value={342}
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

      {/* Sección tabla */}
      <div className="table-section">
        <TableFilters
          onFilterChange={handleFilterChange}
          onExport={handleExport}
        />
        <ContactTable clients={clients} />
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

      {/* Drawer de registro */}
      {showRegister && (
        <NewClientPanel isOpen={showRegister} onClose={() => setShowRegister(false)} />
      )}

    </div>
  )
}

export default ClientDirectory
