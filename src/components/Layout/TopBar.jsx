import React from 'react'
import './TopBar.css'

const TopBar = ({ userName = 'Elena Rossi', userRole = 'Atelier Manager' }) => {
  return (
    <header className="topbar">

      {/* Buscador */}
      <div className="topbar-search">
        <i className="ti ti-search" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar cliente o pedido..."
          className="search-input"
        />
      </div>

      {/* Acciones + perfil */}
      <div className="topbar-right">
        <button className="icon-btn" aria-label="Notificaciones">
          <i className="ti ti-bell" />
        </button>
        <button className="icon-btn" aria-label="Ayuda">
          <i className="ti ti-help-circle" />
        </button>

        <div className="topbar-profile">
          <div className="profile-info">
            <span className="profile-name">{userName}</span>
            <span className="profile-role">{userRole}</span>
          </div>
          <div className="profile-avatar">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>

    </header>
  )
}

export default TopBar