const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const absStats = (items) => {
  const completados = items.filter((a) => a.estado === 'COMPLETADO')
  const costoTotal = completados.reduce((s, a) => s + a.costoTotal, 0)
  const pendientes = items.filter((a) => a.estado === 'PENDIENTE').length
  return [
    { color: 'gold', icon: 'ti ti-coin', value: fmt(costoTotal), unit: '', label: 'Costo Total', sub: 'de abastecimientos completados' },
    { color: 'blue', icon: 'ti ti-truck', value: items.length, unit: '', label: 'Total Abastecimientos', sub: 'registrados' },
    { color: pendientes > 0 ? 'red' : 'green', icon: 'ti ti-clock', value: pendientes, unit: '', label: 'Pendientes', valueRed: pendientes > 0, sub: 'por procesar' },
  ]
}

export const absRenderRow = (a, hovered, handlers, resolverNombreDetalle, fmtAbs) => {
  const { handleCompletarAbastecimiento, handleCancelarAbastecimiento, setSelectedAbs } = handlers
  return (
    <>
      <td>
        <div className="inv-cell-name" style={{ cursor: 'pointer' }} onClick={() => setSelectedAbs(a)}>
          <p className="inv-material-name">#{a.id}</p>
          <p className="inv-material-ref">{a.proveedorNombre || '—'}</p>
        </div>
      </td>
      <td>
        {a.detalles?.length > 0
          ? a.detalles.map((d) => `${resolverNombreDetalle(d)} (×${d.cantidad} · ${fmtAbs(d.costo)} c/u)`).join(', ')
          : '—'}
      </td>
      <td>
        <span className={`inv-badge ${a.estado === 'COMPLETADO' ? 'inv-badge--ok' : a.estado === 'CANCELADO' ? 'inv-badge--empty' : 'inv-badge--warn'}`}>
          <i className={`ti ti-${a.estado === 'COMPLETADO' ? 'circle-check' : a.estado === 'CANCELADO' ? 'x-circle' : 'clock'}`} />
          {a.estado === 'COMPLETADO' ? 'Completado' : a.estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente'}
        </span>
      </td>
      <td className="inv-cell-price">{fmtAbs(a.costoTotal)}</td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          {a.estado === 'PENDIENTE' && (
            <>
              <button className="inv-action-btn inv-action-btn--success" title="Completar" onClick={() => handleCompletarAbastecimiento(a)}>
                <i className="ti ti-check" />
              </button>
              <button className="inv-action-btn inv-action-btn--danger" title="Cancelar" onClick={() => handleCancelarAbastecimiento(a)}>
                <i className="ti ti-x" />
              </button>
            </>
          )}
          <button className="inv-action-btn" title="Ver detalle" onClick={() => setSelectedAbs(a)}>
            <i className="ti ti-eye" />
          </button>
        </div>
      </td>
    </>
  )
}
