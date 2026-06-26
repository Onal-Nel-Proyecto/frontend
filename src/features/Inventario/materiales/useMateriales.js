// ================================================================
// useMateriales — Hook que gestiona la carga, filtros y CRUD de
// materiales. Devuelve el estado y handlers para la tabla.
// ================================================================

import { useState, useCallback, useEffect } from 'react'
import { getMateriales, createMaterial, updateMaterial, changeMaterialEstado } from '../../../api/materialesService'

const LIMITE = 15
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const mapperMaterial = (m) => ({
  id: m.id,
  name: m.nombre || '—',
  ref: m.referencia || m.id || '—',
  tipo_material: m.tipoMaterial || '—',
  unidad_medida: m.unidadMedida || '—',
  desc: m.descripcion || '—',
  stock: Number(m.cantidadDisponible || 0),
  minStock: Number(m.umbralMinimo || 0),
  status: (m.estado || '').toLowerCase(),
})

const mapEstadoMaterial = (statusFilter) => {
  if (statusFilter === 'disponible') return 'DISPONIBLE'
  if (statusFilter === 'agotado') return 'AGOTADO'
  if (statusFilter === 'eliminado') return 'ELIMINADO'
  return null
}

export function useMateriales({ setAlertState }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState(null)
  const [filters, setFilters] = useState({ category: '', status: '', search: '', categoryOptions: [] })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async (filtros = {}, pagina = 1) => {
    setLoading(true)
    try {
      const params = { limite: LIMITE, pagina, ...filtros }
      const res = await getMateriales(params)
      const items = Array.isArray(res?.data) ? res.data.map(mapperMaterial) : []
      setMaterials(items)
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
      console.warn('Error al cargar materiales:', err)
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useDebounce(filters.search, 500)

  useEffect(() => {
    const params = {}
    if (debouncedSearch) params.nombre = debouncedSearch
    const estado = mapEstadoMaterial(filters.status)
    if (estado != null) params.estado = estado
    if (filters.category) params.tipoMaterial = filters.category
    load(params, 1)
  }, [load, debouncedSearch, filters.status, filters.category])

  const handlePageChange = (p) => {
    const params = {}
    if (filters.search) params.nombre = filters.search
    const estado = mapEstadoMaterial(filters.status)
    if (estado != null) params.estado = estado
    if (filters.category) params.tipoMaterial = filters.category
    load(params, p)
  }

  const handleDelete = async (item) => {
    setAlertState({
      type: 'confirm',
      title: 'Desactivar material',
      message: `¿Desactivar "${item.name}"?`,
      onConfirm: async () => {
        setAlertState(null)
        try {
          await changeMaterialEstado(item.id, 'ELIMINADO')
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
        await updateMaterial(data.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          umbralMinimo: data.umbralMinimo ?? 0,
          stock: data.stock,
          unidadMedida: data.unidadMedida,
          tipoMaterial: data.tipoMaterial,
        })
      } else {
        await createMaterial({
          nombre: data.nombre,
          descripcion: data.descripcion,
          umbralMinimo: data.umbralMinimo ?? 0,
          cantidadDisponible: data.cantidadDisponible ?? 0,
          unidadMedida: data.unidadMedida,
          tipoMaterial: data.tipoMaterial,
        })
      }
      await load()
      onSuccess?.()
    } catch (err) {
      onError?.(err)
    }
  }

  return {
    materials,
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
