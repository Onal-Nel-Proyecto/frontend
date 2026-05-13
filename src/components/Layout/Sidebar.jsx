import React from 'react'
import './Sidebar.css'

// Íconos de cada elemento del menú
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
  { id: 'orders',    label: 'Orders',    icon: 'ti-shopping-cart' },
  { id: 'clients',   label: 'Clients',   icon: 'ti-users' },
  { id: 'inventory', label: 'Inventory', icon: 'ti-box' },
  { id: 'materials', label: 'Materials', icon: 'ti-scissors' },
]

const Sidebar = ({ activeItem, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">ona&nel</span>
        <span className="logo-sub">ARTISAN ATELIER</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <i className={`ti ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <i className="ti ti-settings" aria-hidden="true" />
          <span>Settings</span>
        </button>
        <button className="nav-item">
          <i className="ti ti-help-circle" aria-hidden="true" />
          <span>Support</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar