// ================================================================
// InventarioPage — Página principal del módulo de Inventario
// Orquestra las 3 pestañas: Materiales, Productos, Abastecimiento
// ================================================================

import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { useAbastecimiento } from '../../../hooks/useAbastecimiento'
import Alert from '../../../components/ui/feedback/Alert'
import TablaSection from '../components/TablaSection'
import RegisterMaterial from './RegisterMaterial'
import RegisterProducto from './RegisterProducto'
import RegisterAbastecimiento from './RegisterAbastecimiento'
import { useMateriales } from '../materiales/useMateriales'
import { useProductos } from '../productos/useProductos'
import { matColumns } from '../materiales/materialColumns'
import { matRenderRow } from '../materiales/materialRenderRow'
import { prodColumns } from '../productos/productColumns'
import { prodRenderRow } from '../productos/productRenderRow'
import { absColumns } from '../abastecimientos/absColumns'
import { absRenderRow } from '../abastecimientos/absRenderRow'
import './InventarioPage.css'

const fmtAbs = (val) => Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/**
 * InventarioPage — Página principal del módulo de inventario
 * @param {string} tipo - Pestaña activa: 'materiales' | 'productos' | 'abastecimiento'
 */
const InventarioPage = ({ tipo: activeTab = 'materiales' }) => {
  const titulo = activeTab === 'materiales' ? 'Inventario | Materiales' : activeTab === 'productos' ? 'Inventario | Productos' : 'Inventario | Abastecimiento'
  useDocumentTitle(titulo)

  const [alertState, setAlertState] = useState(null)
  const [selectedAbs, setSelectedAbs] = useState(null)

  // ── Hooks de cada módulo ──
  const mat = useMateriales({ setAlertState })
  const prod = useProductos({ setAlertState })

  const {
    abastecimientos,
    proveedores,
    loading: absLoading,
    addAbastecimiento,
    completar: completarAbs,
    cancelar: cancelarAbs,
  } = useAbastecimiento()

  // ── Estado local ──
  const [showDrawerMat, setShowDrawerMat] = useState(false)
  const [showDrawerProd, setShowDrawerProd] = useState(false)
  const [showDrawerAbs, setShowDrawerAbs] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [absFilters, setAbsFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })

  // Filtro cliente-side para abastecimientos
  const filteredAbastecimientos = useMemo(() => {
    let items = abastecimientos
    if (absFilters.status) {
      items = items.filter((a) => a.estado === absFilters.status)
    }
    if (absFilters.search) {
      const q = absFilters.search.toLowerCase()
      items = items.filter(
        (a) =>
          a.proveedorNombre?.toLowerCase().includes(q) ||
          a.observacion?.toLowerCase().includes(q) ||
          String(a.id).includes(q)
      )
    }
    return items
  }, [abastecimientos, absFilters.status, absFilters.search])

  // Resolver nombres de detalle (mapea IDs de materiales/productos)
  const refNameMap = useMemo(() => {
    const map = {}
    mat.materials.forEach((m) => { map[String(m.id)] = m.name })
    prod.products.forEach((p) => { map[String(p.id)] = p.name })
    return map
  }, [mat.materials, prod.products])

  const resolverNombreDetalle = (d) => {
    if (d.nombre && !d.nombre.startsWith('Ref #')) return d.nombre
    const refId = String(d.nombre || '').replace('Ref #', '')
    return refNameMap[refId] || d.nombre || '—'
  }

  // ── Handlers ──
  const handleAddMaterial = () => { setEditingMaterial(null); setShowDrawerMat(true) }
  const handleEditMaterial = (item) => { setEditingMaterial(item); setShowDrawerMat(true) }
  const handleDeleteMaterial = (item) => mat.handleDelete(item)

  const handleSaveMaterial = async (data) => {
    await mat.handleSave(data, {
      onSuccess: () => { setShowDrawerMat(false); setEditingMaterial(null) },
      onError: (err) => setAlertState({ type: 'error', title: 'Error al guardar', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) }),
    })
  }

  const handleAddProduct = () => { setEditingProduct(null); setShowDrawerProd(true) }
  const handleEditProduct = (item) => { setEditingProduct(item); setShowDrawerProd(true) }
  const handleDeleteProduct = (item) => prod.handleDelete(item)

  const handleSaveProduct = async (data) => {
    await prod.handleSave(data, {
      onSuccess: () => { setShowDrawerProd(false); setEditingProduct(null) },
      onError: (err) => setAlertState({ type: 'error', title: 'Error al guardar', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) }),
    })
  }

  const handleAddAbastecimiento = () => setShowDrawerAbs(true)
  const handleSaveAbastecimiento = async (data) => {
    try {
      await addAbastecimiento(data)
      setShowDrawerAbs(false)
      const itemsMsg = data.detalles?.length
        ? 'Ítems: ' + data.detalles.map((d) => `${d.detAbsRefNombre || `Ref #${d.detAbsRefId}`} (×${d.detAbsCant})`).join(', ')
        : ''
      setAlertState({ type: 'success', title: 'Éxito', message: `Abastecimiento registrado correctamente.\n${itemsMsg}`, onClose: () => setAlertState(null) })
      mat.load()
      prod.load()
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error desconocido'
      setAlertState({ type: 'error', title: 'Error al registrar', message: msg, onClose: () => setAlertState(null) })
    }
  }

  const handleCompletarAbastecimiento = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Completar abastecimiento',
      message: `¿Completar el abastecimiento #${item.id}?\n\nEsto actualizará el stock de los ítems.`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await completarAbs(item.id)
          mat.load()
          prod.load()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }

  const handleCancelarAbastecimiento = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Cancelar abastecimiento',
      message: `¿Cancelar el abastecimiento #${item.id}?`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await cancelarAbs(item.id)
          mat.load()
          prod.load()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }

  // Abrir formulario de abastecimiento si se navegó con openForm:true
  const location = useLocation()
  const openFormHandled = useRef(false)
  useEffect(() => {
    if (location.state?.openForm && activeTab === 'abastecimiento' && !openFormHandled.current) {
      openFormHandled.current = true
      setShowDrawerAbs(true)
      window.history.replaceState(null, '')
    }
  }, [location.state, activeTab])

  const handleAddBtn = () => {
    if (activeTab === 'materiales') handleAddMaterial()
    else if (activeTab === 'productos') handleAddProduct()
    else handleAddAbastecimiento()
  }

  // Handlers para pasar a las filas de las tablas
  const matHandlers = { handleEditMaterial, handleDeleteMaterial }
  const prodHandlers = { handleEditProduct, handleDeleteProduct }
  const absHandlers = { handleCompletarAbastecimiento, handleCancelarAbastecimiento, setSelectedAbs }

  // Stats de abastecimientos (inline porque necesita datos del hook)
  const absStats = (items) => {
    const pendientes = items.filter((a) => a.estado === 'PENDIENTE').length
    const completados = items.filter((a) => a.estado === 'COMPLETADO').length
    const costoTotal = items.reduce((s, a) => s + (a.costoTotal || 0), 0)
    return [
      { color: 'blue', icon: 'ti ti-truck', value: items.length, unit: '', label: 'Total Abastecimientos', sub: 'registros en el sistema' },
      { color: 'red', icon: 'ti ti-clock', value: pendientes, unit: '', label: 'Pendientes', valueRed: true, sub: 'aún sin procesar' },
      { color: 'green', icon: 'ti ti-circle-check', value: completados, unit: '', label: 'Completados', sub: 'stock actualizado' },
      { color: 'gold', icon: 'ti ti-coin', value: fmtAbs(costoTotal), unit: '', label: 'Costo Total', sub: 'de abastecimientos completados' },
    ]
  }

  return (
    <div className="inv-content">
      {/* ── Header ── */}
      <div className="inv-header">
        <div className="inv-header-left">
          <div className="inv-header-icon"><i className="ti ti-package" /></div>
          <div>
            <h1 className="inv-title">Inventario</h1>
            <p className="inv-subtitle">Controla tus materiales textiles y productos confeccionados en un solo lugar.</p>
          </div>
        </div>
        <button className="inv-btn-primary" onClick={handleAddBtn}>
          <i className="ti ti-plus" />
          {activeTab === 'materiales' ? 'Añadir Material' : activeTab === 'productos' ? 'Nuevo Producto' : 'Nuevo Abastecimiento'}
        </button>
      </div>

      {/* ── Tabla de Materiales ── */}
      {activeTab === 'materiales' && (
        <TablaSection
          items={mat.materials}
          loading={mat.loading}
          tipo="materiales"
          columns={matColumns}
          renderRow={(item, hovered) => matRenderRow(item, hovered, matHandlers)}
          statConfig={(items) => {
            if (mat.resumen) {
              const s = mat.resumen.total_stock
              return [
                { color: 'blue', icon: 'ti ti-stack', value: s.total.toLocaleString('es-CO'), unit: ' mts', label: 'Stock Total', sub: `${s.materiales_registrados} materiales registrados` },
                { color: 'red', icon: 'ti ti-alert-triangle', value: mat.resumen.alertas_stock, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
                { color: 'green', icon: 'ti ti-package', value: s.materiales_registrados, unit: '', label: 'Materiales Registrados', sub: 'total en catálogo' },
              ]
            }
            const totalStock = items.reduce((s, m) => s + m.stock, 0)
            const lowCount = items.filter((m) => m.status === 'agotado').length
            return [
              { color: 'blue', icon: 'ti ti-stack', value: totalStock.toLocaleString('es-CO'), unit: ' mts', label: 'Stock Total', sub: `${items.length} materiales registrados` },
              { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
              { color: 'green', icon: 'ti ti-package', value: items.length, unit: '', label: 'Materiales Registrados', sub: 'total en catálogo' },
            ]
          }}
          filters={mat.filters}
          onFiltersChange={mat.setFilters}
          pagination={{ page: mat.page, totalPages: mat.totalPages, onPageChange: mat.handlePageChange }}
          totalItems={mat.total}
        />
      )}

      {/* ── Tabla de Productos ── */}
      {activeTab === 'productos' && (
        <TablaSection
          items={prod.products}
          loading={prod.loading}
          tipo="productos"
          columns={prodColumns}
          renderRow={(item, hovered) => prodRenderRow(item, hovered, prodHandlers)}
          statConfig={(items) => {
            if (prod.resumen) {
              return [
                { color: 'blue', icon: 'ti ti-hanger', value: prod.resumen.total_productos, unit: '', label: 'Total Productos', sub: 'en catálogo' },
                { color: 'red', icon: 'ti ti-alert-triangle', value: prod.resumen.alertas_stock, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
                { color: 'green', icon: 'ti ti-coin', value: fmtAbs(prod.resumen.valor_total), unit: '', label: 'Valor del Catálogo', sub: 'precio de venta total' },
              ]
            }
            const totalVal = items.reduce((s, p) => s + p.price * p.stock, 0)
            const lowCount = items.filter((p) => p.status === 'agotado').length
            return [
              { color: 'blue', icon: 'ti ti-hanger', value: items.length, unit: '', label: 'Total Productos', sub: 'en catálogo' },
              { color: 'red', icon: 'ti ti-alert-triangle', value: lowCount, unit: '', label: 'Alertas de Stock', valueRed: true, sub: 'requieren reposición' },
              { color: 'green', icon: 'ti ti-coin', value: fmtAbs(totalVal), unit: '', label: 'Valor del Catálogo', sub: 'precio de venta total' },
            ]
          }}
          filters={prod.filters}
          onFiltersChange={prod.setFilters}
          pagination={{ page: prod.page, totalPages: prod.totalPages, onPageChange: prod.handlePageChange }}
          totalItems={prod.total}
        />
      )}

      {/* ── Tabla de Abastecimientos ── */}
      {activeTab === 'abastecimiento' && (
        <TablaSection
          items={filteredAbastecimientos}
          loading={absLoading}
          tipo="abastecimientos"
          columns={absColumns}
          renderRow={(item, hovered) => absRenderRow(item, hovered, absHandlers, resolverNombreDetalle, fmtAbs)}
          statConfig={absStats}
          filters={absFilters}
          onFiltersChange={setAbsFilters}
          statusOptions={[
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'COMPLETADO', label: 'Completado' },
            { value: 'CANCELADO', label: 'Cancelado' },
          ]}
        />
      )}

      {/* ── Drawers ── */}
      {showDrawerMat && (
        <RegisterMaterial
          isOpen={showDrawerMat}
          onClose={() => { setShowDrawerMat(false); setEditingMaterial(null) }}
          initialData={editingMaterial}
          existingMaterials={mat.materials}
          onSave={handleSaveMaterial}
        />
      )}
      {showDrawerProd && (
        <RegisterProducto
          isOpen={showDrawerProd}
          onClose={() => { setShowDrawerProd(false); setEditingProduct(null) }}
          initialData={editingProduct}
          onSave={handleSaveProduct}
        />
      )}
      {showDrawerAbs && (
        <RegisterAbastecimiento
          isOpen={showDrawerAbs}
          onClose={() => setShowDrawerAbs(false)}
          proveedores={proveedores}
          onSave={handleSaveAbastecimiento}
        />
      )}

      {/* ── Modal detalle de abastecimiento ── */}
      {selectedAbs && (
        <div className="inv-overlay" onClick={() => setSelectedAbs(null)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Abastecimiento #{selectedAbs.id}</h3>
              <button className="inv-modal-close" onClick={() => setSelectedAbs(null)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="inv-modal-body">
              <div className="inv-modal-section">
                <div className="inv-modal-row">
                  <span className="inv-modal-label">Proveedor</span>
                  <span className="inv-modal-value">{selectedAbs.proveedorNombre || '—'}</span>
                </div>
                <div className="inv-modal-row">
                  <span className="inv-modal-label">Fecha</span>
                  <span className="inv-modal-value">
                    {selectedAbs.fecha
                      ? new Date(selectedAbs.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
                <div className="inv-modal-row">
                  <span className="inv-modal-label">Estado</span>
                  <span className={`inv-badge ${selectedAbs.estado === 'COMPLETADO' ? 'inv-badge--ok' : selectedAbs.estado === 'CANCELADO' ? 'inv-badge--empty' : 'inv-badge--warn'}`}>
                    {selectedAbs.estado === 'COMPLETADO' ? 'Completado' : selectedAbs.estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente'}
                  </span>
                </div>
                {selectedAbs.observacion && (
                  <div className="inv-modal-row">
                    <span className="inv-modal-label">Observación</span>
                    <span className="inv-modal-value">{selectedAbs.observacion}</span>
                  </div>
                )}
              </div>
              <div className="inv-modal-section">
                <h4 className="inv-modal-subtitle">Ítems del abastecimiento</h4>
                <div className="inv-modal-table-wrap">
                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Producto/Material</th>
                        <th>Cantidad</th>
                        <th>Costo unitario</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedAbs.detalles || []).map((d, i) => (
                        <tr key={i}>
                          <td>{resolverNombreDetalle(d)}</td>
                          <td>{d.cantidad}</td>
                          <td>{fmtAbs(d.costo)}</td>
                          <td>{fmtAbs(d.cantidad * d.costo)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                        <td style={{ fontWeight: 600 }}>{fmtAbs(selectedAbs.costoTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="inv-modal-footer">
              <button className="inv-btn-primary" onClick={() => setSelectedAbs(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alertas ── */}
      {alertState && (
        <Alert
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={alertState.onConfirm}
          onCancel={alertState.onCancel}
          onClose={alertState.onClose}
        />
      )}
    </div>
  )
}

export default InventarioPage
