const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const absStats = (items) => {
  const pendientes = items.filter((a) => a.estado === 'PENDIENTE').length
  const completados = items.filter((a) => a.estado === 'COMPLETADO').length
  const costoTotal = items.reduce((s, a) => s + (a.costoTotal || 0), 0)
  return [
    { color: 'blue', icon: 'ti ti-truck', value: items.length, unit: '', label: 'Total Abastecimientos', sub: 'registros en el sistema' },
    { color: 'red', icon: 'ti ti-clock', value: pendientes, unit: '', label: 'Pendientes', valueRed: true, sub: 'aún sin procesar' },
    { color: 'green', icon: 'ti ti-circle-check', value: completados, unit: '', label: 'Completados', sub: 'stock actualizado' },
    { color: 'gold', icon: 'ti ti-coin', value: fmt(costoTotal), unit: '', label: 'Costo Total', sub: 'de abastecimientos completados' },
  ]
}

export const absRenderRow = (a, hovered, handlers, resolverNombreDetalle, fmtAbs) => {
  const { handleCompletarAbastecimiento, handleCancelarAbastecimiento, setSelectedAbs } = handlers
  const fecha = a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const estadoClass = a.estado === 'COMPLETADO' ? 'inv-badge--ok' : a.estado === 'CANCELADO' ? 'inv-badge--empty' : 'inv-badge--warn'
  const estadoLabel = a.estado === 'COMPLETADO' ? 'Completado' : a.estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente'
  const itemsResumen = a.detalles?.length > 0
    ? a.detalles.map((d) => `${resolverNombreDetalle(d)} (×${d.cantidad} · ${fmtAbs(d.costo)} c/u)`).join(', ')
    : (a.observacion || `${a.totalItems} ítem(s)`)

  return (
    <>
      <td>
        <div className="inv-cell-name">
          <p className="inv-material-name">#{a.id} — {a.proveedorNombre}</p>
          <p className="inv-material-ref">{fecha}</p>
        </div>
      </td>
      <td className="inv-cell-specs" title={itemsResumen}>{itemsResumen}</td>
      <td>
        <span className={`inv-badge ${estadoClass}`}>
          <i className={`ti ti-${a.estado === 'COMPLETADO' ? 'circle-check' : a.estado === 'CANCELADO' ? 'x-circle' : 'clock'}`} />
          {estadoLabel}
        </span>
      </td>
      <td className="inv-cell-price">{fmtAbs(a.costoTotal)}</td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Ver detalle" onClick={() => setSelectedAbs(a)}><i className="ti ti-eye" /></button>
          {a.estado === 'PENDIENTE' && (
            <>
              <button className="inv-action-btn inv-action-btn--success" title="Completar" onClick={() => handleCompletarAbastecimiento(a)}><i className="ti ti-circle-check" /></button>
              <button className="inv-action-btn inv-action-btn--danger" title="Cancelar" onClick={() => handleCancelarAbastecimiento(a)}><i className="ti ti-trash" /></button>
            </>
          )}
        </div>
      </td>
    </>
  )
}
