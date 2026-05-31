import React from 'react'
import './StatusBadge.css'

// Badge de fecha del último pedido o estado "No reciente"
// Props:
//   date → string con la fecha ej: 'Oct 24, 2023'
//          si es null/undefined muestra "No reciente"

const StatusBadge = ({ date }) => {
  if (!date) {
    return (
      <span className="status-badge status-badge--inactive">
        No reciente
      </span>
    )
  }

  // Separa mes+día del año para mostrarlos en dos líneas
  const [monthDay, year] = date.split(', ')

  return (
    <span className="status-badge status-badge--date">
      <span className="status-badge__month">{monthDay}</span>
      <span className="status-badge__year">{year}</span>
    </span>
  )
}

export default StatusBadge