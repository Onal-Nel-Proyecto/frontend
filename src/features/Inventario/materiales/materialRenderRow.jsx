import StockBar from '../components/StockBar'

export const materialStats = (items) => {
  const totalStock = items.reduce((s, m) => s + m.stock, 0)
  const lowCount = items.filter((m) => m.status === 'agotado').length
  return [
    { color: 'blue', icon: 'ti ti-stack', value: totalStock.toLocaleString('es-CO'), unit: ' mts', label: 'Stock Total', sub: `${items.length} materiales registrados` },
    { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
    { color: 'green', icon: 'ti ti-package', value: items.length, unit: '', label: 'Materiales Registrados', sub: 'total en catálogo' },
  ]
}

export const matRenderRow = (m, hovered, handlers) => {
  const { handleEditMaterial, handleDeleteMaterial } = handlers
  return (
    <>
      <td>
        <div className="inv-cell-name">
          <p className="inv-material-name">{m.name}</p>
          <p className="inv-material-ref">{m.ref}</p>
        </div>
      </td>
      <td><span className="inv-cat-tag">{m.tipo_material || '—'}</span></td>
      <td className="inv-cell-specs">{m.unidad_medida || '—'}</td>
      <td className="inv-cell-specs">{m.desc || '—'}</td>
      <td><StockBar current={m.stock} min={m.minStock} /></td>
      <td>
        <span className={`inv-badge ${m.status === 'agotado' ? 'inv-badge--empty' : m.status === 'eliminado' ? 'inv-badge--empty' : 'inv-badge--ok'}`}>
          <i className={`ti ti-${m.status === 'disponible' ? 'circle-check' : 'x-circle'}`} />
          {m.status === 'disponible' ? 'Disponible' : m.status === 'agotado' ? 'Agotado' : 'Eliminado'}
        </span>
      </td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Editar" onClick={() => handleEditMaterial(m)}><i className="ti ti-edit" /></button>
          {m.status !== 'eliminado' && (
            <button className="inv-action-btn inv-action-btn--danger" title="Desactivar" onClick={() => handleDeleteMaterial(m)}><i className="ti ti-trash" /></button>
          )}
        </div>
      </td>
    </>
  )
}
