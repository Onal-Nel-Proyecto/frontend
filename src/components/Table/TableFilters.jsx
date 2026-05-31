import React, { useState } from 'react'
import './TableFilters.css'

// Barra de filtros encima de la tabla
// Props:
//   onFilterChange → función que recibe el filtro activo
//   onExport       → función para exportar

const TABS = ['Activos', 'Inactivos', 'Todos']

const TableFilters = ({ onFilterChange, onExport }) => {
  const [activeTab, setActiveTab] = useState('Activos')
  const [category, setCategory]   = useState('')

  const handleTab = (tab) => {
    setActiveTab(tab)
    onFilterChange?.({ tab, category })
  }

  const handleCategory = (e) => {
    setCategory(e.target.value)
    onFilterChange?.({ tab: activeTab, category: e.target.value })
  }

  return (
    <div className="table-filters">
      <div className="table-filters__left">
        <span className="table-filters__title">Lista de Contactos</span>
        <div className="table-filters__tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'tab-btn--active' : ''}`}
              onClick={() => handleTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="table-filters__right">
        <select
          className="filter-select"
          value={category}
          onChange={handleCategory}
        >
          <option value="">Filtrar por categoría</option>
          <option value="interiorismo">Interiorismo Premium</option>
          <option value="textiles">Boutique de Textiles</option>
          <option value="eventos">Diseño de Eventos</option>
          <option value="hosteleria">Hostelería Gran Lujo</option>
        </select>

        <button className="export-btn" onClick={onExport}>
          <i className="ti ti-download" aria-hidden="true" />
          Exportar
        </button>
      </div>
    </div>
  )
}

export default TableFilters