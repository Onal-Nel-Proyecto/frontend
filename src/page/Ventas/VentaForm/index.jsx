// ================================================================
// VentaForm — Drawer para registrar una nueva venta
// ================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { FiShoppingCart, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import Drawer from '../../../components/common/Drawer';
import Alert from '../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../components/ui/feedback/LoadingOverlay';
import ClienteSearch from '../../../features/pedidos/components/ClienteSearch';
import NewClientPanel from '../../RegisterClient';
import { useVentas } from '../../../hooks/useVentas';
import { searchProductos } from '../../../api/productosService';
import { createCliente } from '../../../api/clientesService';
import styles from './VentaForm.module.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const VentaForm = ({ isOpen, onClose }) => {
  const { addVenta } = useVentas();

  const [clienteId, setClienteId] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);

  // Productos seleccionados
  const [items, setItems] = useState([]);

  // Búsqueda de productos
  const [prodQuery, setProdQuery] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [prodHighlight, setProdHighlight] = useState(-1);
  const prodDebounce = useRef(null);
  const prodWrapRef = useRef(null);

  // Descuento y pago inicial
  const [descuento, setDescuento] = useState(0);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('EFECTIVO');

  // Estados UI
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clienteError, setClienteError] = useState('');

  // ─── Cálculos ───
  const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio, 0);
  const descuentoNum = Number(descuento) || 0;
  const total = Math.max(0, subtotal - descuentoNum);

  // ─── Handlers ───

  const handleClienteChange = useCallback((cliente) => {
    setClienteId(cliente.cliente_id || '');
    setClienteError('');
  }, []);

  const handleAddCliente = useCallback(() => {
    setShowClientForm(true);
  }, []);

  const handleCreateCliente = useCallback(async (clienteData) => {
    try {
      const resp = await createCliente(clienteData);
      const data = resp?.data || resp;
      if (resp?.status || data?.cliente_id) {
        const info = {
          cliente_id: data.cliente_id,
          cliente_nombre: data.cliente_nombre || clienteData.cliente_nombre,
          cliente_apellido: data.cliente_apellido || clienteData.cliente_apellido || '',
        };
        handleClienteChange(info);
        setNuevoCliente(info);
        return { ok: true, data: resp };
      }
      return { ok: false, error: resp?.msg || 'Error al crear el cliente' };
    } catch (err) {
      return { ok: false, error: err?.response?.data?.error || 'Error al conectar con el servidor' };
    }
  }, [handleClienteChange]);

  // ─── Búsqueda de productos ───

  const fetchProductos = useCallback(async (query) => {
    if (!query.trim()) {
      setProdResults([]);
      setProdOpen(false);
      return;
    }
    setProdLoading(true);
    try {
      const data = await searchProductos(query);
      setProdResults(data);
      setProdOpen(true);
      setProdHighlight(-1);
    } catch (err) {
      console.error('Error al buscar productos:', err);
      setProdResults([]);
      setProdOpen(false);
    } finally {
      setProdLoading(false);
    }
  }, []);

  const handleProdInputChange = (e) => {
    const val = e.target.value;
    setProdQuery(val);
    if (prodDebounce.current) clearTimeout(prodDebounce.current);
    prodDebounce.current = setTimeout(() => fetchProductos(val), 300);
  };

  const addProducto = (producto) => {
    // Evitar duplicados
    if (items.some((it) => it.producto_id === producto.id)) return;

    setItems((prev) => [
      ...prev,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precioUnitario) || 0,
        cantidad: 1,
        stock: Number(producto.stock) || 0,
      },
    ]);
    setProdQuery('');
    setProdResults([]);
    setProdOpen(false);
  };

  const updateItem = (productoId, field, value) => {
    setItems((prev) =>
      prev.map((it) =>
        it.producto_id === productoId ? { ...it, [field]: value } : it
      )
    );
  };

  const removeItem = (productoId) => {
    setItems((prev) => prev.filter((it) => it.producto_id !== productoId));
  };

  // ─── Teclado en dropdown de productos ───

  const handleProdKeyDown = (e) => {
    if (!prodOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setProdHighlight((prev) => (prev < prodResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setProdHighlight((prev) => (prev > 0 ? prev - 1 : prodResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (prodHighlight >= 0 && prodHighlight < prodResults.length) {
          addProducto(prodResults[prodHighlight]);
        }
        break;
      case 'Escape':
        setProdOpen(false);
        break;
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (prodWrapRef.current && !prodWrapRef.current.contains(e.target)) {
        setProdOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      if (prodDebounce.current) clearTimeout(prodDebounce.current);
    };
  }, []);

  // ─── Submit ───

  const handleSubmit = async () => {
    // Validar cliente
    if (!clienteId) {
      setClienteError('Selecciona un cliente');
      return;
    }
    // Validar items
    if (items.length === 0) {
      setAlert({ type: 'error', title: 'Sin productos', message: 'Agrega al menos un producto a la venta', onClose: () => setAlert(null) });
      return;
    }
    // Validar items con datos correctos
    for (const it of items) {
      if (it.cantidad < 1) {
        setAlert({ type: 'error', title: 'Cantidad inválida', message: `"${it.nombre}" debe tener cantidad ≥ 1`, onClose: () => setAlert(null) });
        return;
      }
      if (it.precio <= 0) {
        setAlert({ type: 'error', title: 'Precio inválido', message: `"${it.nombre}" debe tener un precio mayor a 0`, onClose: () => setAlert(null) });
        return;
      }
    }

    setSubmitting(true);
    onClose();
    setLoading(true);

    const payload = {
      cliente_id: clienteId,
      detalles: items.map((it) => ({
        producto_id: it.producto_id,
        cantidad: it.cantidad,
        precio: it.precio,
      })),
      descuento: descuentoNum,
    };

    // Si hay pago inicial
    const pagoMontoNum = Number(pagoMonto) || 0;
    if (pagoMontoNum > 0) {
      payload.pagos = [{ monto: pagoMontoNum, metodo_pago: pagoMetodo }];
    }

    try {
      await addVenta(payload);
      setLoading(false);
      setAlert({
        type: 'success',
        title: 'Venta registrada',
        message: 'La venta se registró correctamente',
        onConfirm: () => { setAlert(null); window.location.reload(); },
        onClose: () => { setAlert(null); window.location.reload(); },
      });
    } catch (err) {
      setLoading(false);
      setAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo registrar la venta',
        onClose: () => setAlert(null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Nueva Venta"
        subtitle="Registra una venta con productos y opcionalmente un pago inicial."
        icon={<FiShoppingCart />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : <><FiPlus /> Registrar Venta</>}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          {/* ══ CLIENTE ══ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Cliente</div>
            <ClienteSearch
              initialNombre={nuevoCliente
                ? `${nuevoCliente.cliente_nombre} ${nuevoCliente.cliente_apellido}`.trim()
                : ''}
              onChange={handleClienteChange}
              error={clienteError}
              onAddCliente={handleAddCliente}
            />
          </div>

          {/* ══ PRODUCTOS ══ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Productos</div>

            {/* Buscador */}
            <div className={styles.prodSearchWrap} ref={prodWrapRef}>
              <FiSearch className={styles.prodSearchIcon} />
              <input
                className={styles.prodSearchInput}
                type="text"
                placeholder="Buscar producto por nombre…"
                value={prodQuery}
                onChange={handleProdInputChange}
                onKeyDown={handleProdKeyDown}
                onFocus={() => { if (prodResults.length > 0) setProdOpen(true); }}
                autoComplete="off"
              />
              {prodLoading && (
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <i className="ti ti-loader ti-spin" />
                </span>
              )}

              {prodOpen && prodResults.length > 0 && (
                <ul className={styles.prodDropdown}>
                  {prodResults.map((p, idx) => (
                    <li
                      key={p.id}
                      className={`${styles.prodOption} ${prodHighlight === idx ? styles.prodOptionHighlighted : ''}`}
                      onClick={() => addProducto(p)}
                      onMouseEnter={() => setProdHighlight(idx)}
                    >
                      <div className={styles.prodOptionInfo}>
                        <span className={styles.prodOptionName}>{p.nombre}</span>
                        <span className={styles.prodOptionMeta}>
                          {p.tipoPrenda || p.tipoProducto || ''}
                          {p.talla ? ` · Talla ${p.talla}` : ''}
                          {p.stock > 0 ? ` · Stock: ${p.stock}` : ' · Sin stock'}
                        </span>
                      </div>
                      <span className={styles.prodOptionPrice}>{fmt(p.precioUnitario)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {prodOpen && !prodLoading && prodQuery.trim() && prodResults.length === 0 && (
                <div className={styles.prodDropdown}>
                  <div className={styles.prodNoResults}>No se encontraron productos</div>
                </div>
              )}
            </div>

            {/* Tabla de items seleccionados */}
            {items.length > 0 ? (
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Producto</th>
                    <th style={{ width: '18%', textAlign: 'right' }}>Cant.</th>
                    <th style={{ width: '22%', textAlign: 'right' }}>Precio</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                    <th style={{ width: '5%' }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.producto_id}>
                      <td>
                        <span className={styles.itemName} title={it.nombre}>{it.nombre}</span>
                      </td>
                      <td>
                        <input
                          className={styles.itemInput}
                          type="number"
                          min={1}
                          max={it.stock > 0 ? it.stock : 9999}
                          value={it.cantidad}
                          onChange={(e) => updateItem(it.producto_id, 'cantidad', Math.max(1, Number(e.target.value) || 1))}
                        />
                      </td>
                      <td>
                        <input
                          className={styles.itemInput}
                          type="number"
                          min={1}
                          step={100}
                          value={it.precio}
                          onChange={(e) => updateItem(it.producto_id, 'precio', Math.max(1, Number(e.target.value) || 0))}
                        />
                      </td>
                      <td className={styles.itemTotal}>{fmt(it.cantidad * it.precio)}</td>
                      <td>
                        <button className={styles.itemDelBtn} onClick={() => removeItem(it.producto_id)} title="Quitar">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyItems}>
                <FiSearch className={styles.emptyItemsIcon} />
                Busca y selecciona productos para agregarlos a la venta
              </div>
            )}
          </div>

          {/* ══ TOTALES ══ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Totales</div>

            <div className={styles.field}>
              <label className={styles.label}>Descuento (opcional)</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                step={1000}
                placeholder="0"
                value={descuento}
                onChange={(e) => setDescuento(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span className={styles.totalValue}>{fmt(subtotal)}</span>
              </div>
              {descuentoNum > 0 && (
                <div className={styles.totalRow}>
                  <span>Descuento</span>
                  <span className={styles.totalValue} style={{ color: '#dc2626' }}>-{fmt(descuentoNum)}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
                <span>Total</span>
                <span className={styles.totalValueGrand}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ PAGO INICIAL (OPCIONAL) ══ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Pago inicial (opcional)</div>
            <div className={styles.pagoRow}>
              <div className={styles.field}>
                <label className={styles.label}>Monto</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="0"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Método</label>
                <select
                  className={styles.select}
                  value={pagoMetodo}
                  onChange={(e) => setPagoMetodo(e.target.value)}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>
            </div>
            {Number(pagoMonto) > total && (
              <span className={styles.fieldError}>El pago no puede ser mayor al total ({fmt(total)})</span>
            )}
          </div>
        </div>
      </Drawer>

      {/* Panel de registro de nuevo cliente */}
      <NewClientPanel
        isOpen={showClientForm}
        onClose={() => setShowClientForm(false)}
        onGuardar={handleCreateCliente}
      />

      {loading && <LoadingOverlay title="Registrando venta…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
    </>
  );
};

export default VentaForm;
