import React from 'react'
import './AvatarBadge.css'

// Círculo con iniciales del cliente
// Props:
//   name  → nombre completo, genera las iniciales automáticamente
//   color → 'gray' | 'blue' | 'green' | 'coral' (por defecto rota por índice)

const COLORS = ['gray', 'blue', 'green', 'coral']

const AvatarBadge = ({ name = '', colorIndex = 0 }) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const color = COLORS[colorIndex % COLORS.length]

  return (
    <div className={`avatar-badge avatar-badge--${color}`}>
      {initials}
    </div>
  )
}

export default AvatarBadge