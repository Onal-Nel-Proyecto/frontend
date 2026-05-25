import React from 'react'
import './GrowthCard.css'

// Tarjeta destacada de crecimiento mensual (fondo oscuro)
// Props:
//   percentage  → ej: '+12.4%'
//   description → texto descriptivo debajo del porcentaje
//   period      → ej: 'Crecimiento Mensual'

const GrowthCard = ({
  percentage   = '+12.4%',
  period       = 'Crecimiento Mensual',
  description  = 'Continúas expandiendo tu presencia en el mercado de alta costura este trimestre.',
}) => {
  const isPositive = percentage.startsWith('+')

  return (
    <div className="growth-card">
      <span className="growth-card__period">{period}</span>

      <div className="growth-card__percent-row">
        <span className={`growth-card__percent ${isPositive ? 'positive' : 'negative'}`}>
          {percentage}
        </span>
        <i
          className={`ti ${isPositive ? 'ti-trending-up' : 'ti-trending-down'}`}
          aria-hidden="true"
        />
      </div>

      <p className="growth-card__desc">{description}</p>
    </div>
  )
}

export default GrowthCard