import React, { useState } from 'react'
import './TableFilters.css'

const TABS = ['Activos', 'Inactivos', 'Todos']

const TableFilters = ({ onFilterChange, onExport }) => {
  const [activeTab, setActiveTab] = useState('Activos')

  const handleTab = (tab) => {
    setActiveTab(tab)
    onFilterChange?.({ tab })
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
        <select className="filter-select" value={activeTab} onChange={(e) => handleTab(e.target.value)}>
          <option value="Activos">Activos</option>
          <option value="Inactivos">Inactivos</option>
          <option value="Todos">Todos</option>
        </select>
      </div>
    </div>
  )
}

export default TableFilters