// ================================================================
// StockBar — Barra de progreso visual del stock
// ================================================================

const StockBar = ({ current, min }) => {
  const pct = Math.min((current / Math.max(min, 1)) * 100, 100)
  const color = current === 0 ? '#e74c3c' : current <= min ? '#e67e22' : '#2e7d32'
  return (
    <div className="inv-stockbar-track">
      <div className="inv-stockbar-fill" style={{ width: `${pct}%`, background: color }} />
      <span className="inv-stockbar-label" style={{ color }}>
        {current} <small>{current <= min ? '⚠' : ''}</small>
      </span>
    </div>
  )
}

export default StockBar
