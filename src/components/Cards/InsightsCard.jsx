import React from 'react'
import './InsightsCard.css'

// Tarjeta de insights / segmentación
// Props:
//   title       → título de la card
//   description → texto con el insight principal
//   ctaLabel    → texto del botón
//   onCta       → función al hacer clic
//   highlight   → número o % destacado ej: '65%'

const InsightsCard = ({
  title       = 'Insights de Segmentación',
  highlight   = '65%',
  description = 'de tus clientes corporativos han aumentado su volumen de pedidos este trimestre.',
  ctaLabel    = 'Ver Reporte',
  onCta,
}) => {
  return (
    <div className="insights-card">
      <div className="insights-card__header">
        <div className="insights-card__icon">
          <i className="ti ti-chart-bar" aria-hidden="true" />
        </div>
        <h4 className="insights-card__title">{title}</h4>
      </div>

      <p className="insights-card__text">
        <span className="insights-card__highlight">{highlight}</span>
        {' '}{description}
      </p>

      <button
        className="insights-card__btn"
        onClick={onCta}
      >
        <i className="ti ti-chart-line" aria-hidden="true" />
        {ctaLabel}
      </button>
    </div>
  )
}

export default InsightsCard