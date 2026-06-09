import React from 'react'
import AvatarBadge  from './AvatarBadge'
import StatusBadge  from './StatusBadge'
import './ContactTable.css'

// Tabla principal de contactos
// Props:
//   clients → array de objetos:
//     { id, name, category, phone, address, lastOrder }

const ContactTable = ({ clients = [], onView, onEdit, onDelete, onReactivate, totalClientes }) => {
  return (
    <div className="contact-table-wrap">
      <table className="contact-table">
        <thead>
          <tr>
            <th>Nombre del Cliente</th>
            <th>Teléfono</th>
            <th>Dirección de Entrega</th>
            <th>fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {clients.map((client, index) => (
            <tr key={client.id}>

              {/* Nombre + avatar + categoría */}
              <td>
                <div className="client-cell">
                  <AvatarBadge name={client.name} colorIndex={index} />
                  <div>
                    <p className="client-name">{client.name}</p>
                    <p className="client-category">{client.category}</p>
                  </div>
                </div>
              </td>

              <td className="td-phone">{client.phone}</td>
              <td className="td-address">{client.address}</td>

              <td>
                <StatusBadge date={client.lastOrder} />
              </td>

              {/* Botones de acción */}
              <td>
                <div className="action-btns">
                  <button
                    className="action-btn"
                    aria-label="Ver cliente"
                    onClick={() => onView?.(client)}
                    title="Ver detalle"
                  >
                    <i className="ti ti-eye" />
                  </button>
                  <button
                    className="action-btn"
                    aria-label="Editar cliente"
                    onClick={() => onEdit?.(client)}
                    title="Editar cliente"
                  >
                    <i className="ti ti-edit" />
                  </button>
                  {client.category === 'Inactivo' && (
                    <button
                      className="action-btn action-btn--reactivate"
                      aria-label="Reactivar"
                      onClick={() => onReactivate?.(client)}
                      title="Reactivar cliente"
                    >
                      <i className="ti ti-refresh" />
                    </button>
                  )}
                  <button
                    className="action-btn action-btn--danger"
                    aria-label="Eliminar"
                    onClick={() => onDelete?.(client)}
                    title="Eliminar cliente"
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      <p className="table-footer">
        Mostrando {clients.length} de {totalClientes ?? 0} clientes
      </p>
    </div>
  )
}

export default ContactTable