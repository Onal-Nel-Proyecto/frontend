// MaintenanceCard.jsx
import './MaintenanceCard.css';

export function MaintenanceCard() {
  return (
    <div className="maintenance-card">
      <img
        src="https://images.unsplash.com/photo-1455390582262-044cdead277a"
        alt="Mantenimiento"
      />
      <div>
        <h3>Mantenimiento de Datos</h3>
        <p>
          ¿Necesitas limpiar tu lista de contactos inactivos? Programa una revisión periódica cada 6 meses.
        </p>
        <span>Configurar alertas de limpieza</span>
      </div>
    </div>
  );
}
