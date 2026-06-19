import React from 'react'
import './StatCard.css'

// Tarjeta simple de métrica: ícono + label + número
// Props:
//   icon      → clase Tabler ej: 'ti-users'
//   label     → texto pequeño arriba ej: 'Total Clientes'
//   value     → número principal ej: 342
//   highlight → si es true, fondo oscuro (para VIP)

const StatCard = ({ icon, label, value, highlight = false }) => {
  return (
    <div className={`stat-card ${highlight ? 'stat-card--highlight' : ''}`}>
      <div className="stat-card__icon">
        <i className={`ti ${icon}`} aria-hidden="true" />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
      </div>
    </div>
  )
}

export default StatCard


// Uso en ClientDirectory.jsx:
// <StatCard icon="ti-users"     label="Total Clientes" value={342} />
// <StatCard icon="ti-star"      label="Clientes VIP"   value={48} highlight />