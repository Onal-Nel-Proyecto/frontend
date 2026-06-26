// ================================================================
// useProductos — Hook que gestiona la carga, filtros y CRUD de
// productos. Devuelve el estado y handlers para la tabla.
// ================================================================

import { useState, useCallback, useEffect } from 'react'
import { getProductos, createProducto, updateProducto, changeProductoEstado } from '../../../api/productosApiService'

const LIMITE = 15
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const mapperProducto = (p) => ({
  id: p.id,
  name: p.nombre || '—',
  ref: p.referencia || p.id || '—',
  descripcion: p.descripcion || '—',
  tipo_prenda: p.tipoPrenda || '—',
  categoria: p.categoria || '—',
  genero: p.genero || '—',
  talla: p.talla || '—',
  price: Number(p.precioUnitario || 0),
  stock: Number(p.cantidadDisponible || p.stock || 0),
  minStock: Number(p.umbralMinimo || 0),
  tipoProducto: p.tipoProducto || 'INVENTARIO',
  status: typeof p.estado === 'string' ? p.estado.toLowerCase() : p.estado === 1 ? 'disponible' : p.estado === 2 ? 'agotado' : 'eliminado',
})

const mapEstadoProducto = (statusFilter) => {
  if (statusFilter === 'disponible') return 1
  if (statusFilter === 'agotado') return 2
  if (statusFilter === 'eliminado') return 3
  return null
}

export function useProductos({ setAlertState }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState(null)
  const [filters, setFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (filtros = {}, pagina = 1) => {
    setLoading(true)
    try {
      const params = { limite: LIMITE, pagina, tipoProducto: 'INVENTARIO', ...filtros }
      const res = await getProductos(params)
      const items = Array.isArray(res?.data) ? res.data.map(mapperProducto) : []
      setProducts(items)
      setPage(pagina)
      if (res?.resumen) setResumen(res.resumen)
      if (res?.paginacion) {
        setTotalPages(res.paginacion.totalPaginas || 1)
        setTotal(res.paginacion.total || items.length)
      } else {
        const totalDesdeAPI = res?.total ?? res?.meta?.total ?? items.length
        setTotalPages(Math.max(Math.ceil(totalDesdeAPI / LIMITE), 1))
        setTotal(totalDesdeAPI)
      }
    } catch (err) {
      console.warn('Error al cargar productos:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useDebounce(filters.search, 500)

  useEffect(() => {
    const params = { tipoProducto: 'INVENTARIO' }
    if (debouncedSearch) params.nombre = debouncedSearch
    const estado = mapEstadoProducto(filters.status)
    if (estado != null) params.estado = estado
    if (filters.category) params.categoria = filters.category
    load(params, 1)
  }, [load, debouncedSearch, filters.status, filters.category])

  const handlePageChange = (p) => {
    const params = { tipoProducto: 'INVENTARIO' }
    if (filters.search) params.nombre = filters.search
    const estado = mapEstadoProducto(filters.status)
    if (estado != null) params.estado = estado
    if (filters.category) params.categoria = filters.category
    load(params, p)
  }

  const handleDelete = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Desactivar producto',
      message: `¿Desactivar "${item.name}"?`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await changeProductoEstado(item.id, 3)
          await load()
        } catch (err) {
          setAlertState({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message, onClose: () => setAlertState(null) })
        }
      },
      onCancel: () => setAlertState(null),
    })
  }

  const handleSave = async (data, { onSuccess, onError } = {}) => {
    try {
      if (data.id) {
        await updateProducto(data.id, {
          nombre: data.nombre,
          tipoProducto: data.tipoProducto,
          precioUnitario: data.precio || 0,
          genero: data.genero,
          tipoPrenda: data.tipoPrenda,
          categoriaId: data.categoriaId,
          talla: data.talla,
          umbralMinimo: data.umbralMinimo ?? 0,
        })
      } else {
        await createProducto({
          nombre: data.nombre,
          tipoProducto: data.tipoProducto,
          precioUnitario: data.precio || 0,
          genero: data.genero,
          tipoPrenda: data.tipoPrenda,
          categoriaId: data.categoriaId,
          talla: data.talla,
          cantidadDisponible: data.cantidadDisponible ?? 0,
          umbralMinimo: data.umbralMinimo ?? 0,
        })
      }
      await load()
      onSuccess?.()
    } catch (err) {
      try { onError?.(err) } catch { /* onError falló silenciosamente */ }
    }
  }

  return {
    products,
    loading,
    resumen,
    filters,
    setFilters,
    page,
    totalPages,
    total,
    load,
    handlePageChange,
    handleDelete,
    handleSave,
  }
}
