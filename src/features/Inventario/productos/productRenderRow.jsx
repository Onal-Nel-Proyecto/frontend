import StockBar from '../components/StockBar'

const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const productStats = (items) => {
  const totalValue = items.reduce((s, p) => s + p.price * p.stock, 0)
  const lowCount = items.filter((p) => p.status === 'agotado').length
  return [
    { color: 'gold', icon: 'ti ti-coin', value: fmt(totalValue), unit: '', label: 'Valor Inventario', sub: 'precio × stock' },
    { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
    { color: 'green', icon: 'ti ti-hanger', value: items.length, unit: '', label: 'Productos Registrados', sub: 'total en catálogo' },
  ]
}

export const prodRenderRow = (p, hovered, handlers) => {
  const { handleEditProduct, handleDeleteProduct } = handlers
  return (
    <>
      <td>
        <div className="inv-cell-name">
          <p className="inv-material-name">{p.name}</p>
          <p className="inv-material-ref">{p.ref}</p>
        </div>
      </td>
      <td className="inv-cell-specs">{p.descripcion || '—'}</td>
      <td><span className="inv-cat-tag">{p.categoria || '—'}</span></td>
      <td><span className="inv-cat-tag">{p.tipo_prenda || '—'}</span></td>
      <td className="inv-cell-specs">{p.genero} · {p.talla}</td>
      <td className="inv-cell-price">{fmt(p.price)}</td>
      <td><StockBar current={p.stock} min={p.minStock} /></td>
      <td>
        <span className={`inv-badge ${p.status === 'agotado' ? 'inv-badge--empty' : p.status === 'eliminado' ? 'inv-badge--empty' : 'inv-badge--ok'}`}>
          <i className={`ti ti-${p.status === 'disponible' ? 'circle-check' : 'x-circle'}`} />
          {p.status === 'disponible' ? 'Disponible' : p.status === 'agotado' ? 'Agotado' : 'Eliminado'}
        </span>
      </td>
      <td>
        <div className={`inv-actions ${hovered ? 'inv-actions--visible' : ''}`}>
          <button className="inv-action-btn" title="Editar" onClick={() => handleEditProduct(p)}><i className="ti ti-edit" /></button>
          {p.status !== 'eliminado' && (
            <button className="inv-action-btn inv-action-btn--danger" title="Desactivar" onClick={() => handleDeleteProduct(p)}><i className="ti ti-trash" /></button>
          )}
        </div>
      </td>
    </>
  )
}
