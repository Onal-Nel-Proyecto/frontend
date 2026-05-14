import React from 'react'
import './MaintenanceCard.css'

// Tarjeta de mantenimiento de datos con imagen y CTA
// Props:
//   title       → título principal
//   description → texto descriptivo
//   ctaLabel    → texto del enlace/botón
//   onCta       → función al hacer clic en el CTA
//   imgSrc      → URL de la imagen (opcional)

const MaintenanceCard = ({
  title      = 'Mantenimiento de Datos',
  description = '¿Necesitas limpiar tu lista de contactos inactivos? Programa una revisión periódica cada 6 meses.',
  ctaLabel   = 'Configurar alertas de limpieza',
  onCta,
  imgSrc,
}) => {
  return (
    <div className="maintenance-card">
      {imgSrc && (
        <div className="maintenance-card__img-wrap">
          <img src={imgSrc} alt="mantenimiento" className="maintenance-card__img" />
        </div>
      )}

      <div className="maintenance-card__body">
        <div className="maintenance-card__icon">
          <i className="ti ti-database" aria-hidden="true" />
        </div>
        <h4 className="maintenance-card__title">{title}</h4>
        <p className="maintenance-card__desc">{description}</p>
        <button
          className="maintenance-card__cta"
          onClick={onCta}
        >
          {ctaLabel}
          <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default MaintenanceCard