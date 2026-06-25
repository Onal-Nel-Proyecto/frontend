// ================================================================
// VentaForm — Drawer para registrar una nueva venta
// ================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiShoppingCart, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import ClienteSearch from '../../../pedidos/components/ClienteSearch';
import NewClientPanel from '../../../Clientes/pages/RegisterClient';
import { useVentas } from '../../hooks/useVentas';
import { searchProductos } from '../../../Inventario/services/productosService';
import { createCliente } from '../../../Clientes/services/clientesService';
import styles from './VentaForm.module.css';

const FMT_SAFE_MAX = 999999999;
const fmt = (val) => {
  const num = Number(val) || 0;
  // Evitar overflow de toLocaleString con números enormes
  const clamped = Math.min(Math.max(num, -FMT_SAFE_MAX), FMT_SAFE_MAX);
  return clamped.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

/** Retorna la fecha local en formato YYYY-MM-DD (no UTC) */
const toLocalDateStr = (date) => {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  // Estados UI
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clienteError, setClienteError] = useState('');

  // ─── Cálculos ───
  const subtotal = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio) || 0), 0);
  const descuentoNum = Math.min(100, Math.max(0, Number(descuento) || 0));
  const total = Math.round(Math.max(0, subtotal * (1 - descuentoNum / 100)) * 100) / 100;
  console.warn('🧮 VentaForm RENDER — total:', { subtotal, descuentoNum, total, pagoMonto });

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
          cliente_id: data.cliente_id || data.id,
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
    // Evitar duplicados — mostrar error si ya existe
    if (items.some((it) => it.producto_id === producto.id)) {
      setAlert({
        type: 'error',
        title: 'Producto duplicado',
        message: `El producto "${producto.nombre}" ya está agregado. Solo puede haber una línea por producto.`,
        onClose: () => setAlert(null),
      });
      return;
    }

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
      const cant = Number(it.cantidad) || 0;
      const prec = Number(it.precio) || 0;
      if (cant < 1) {
        setAlert({ type: 'error', title: 'Cantidad inválida', message: `"${it.nombre}" debe tener cantidad ≥ 1`, onClose: () => setAlert(null) });
        return;
      }
      if (cant > 300) {
        setAlert({ type: 'error', title: 'Cantidad inválida', message: `"${it.nombre}" no puede exceder 300 unidades`, onClose: () => setAlert(null) });
        return;
      }
      if (Number(it.cantidad) > Number(it.stock)) {
        setAlert({ type: 'error', title: 'Stock insuficiente', message: `"${it.nombre}" — la cantidad (${it.cantidad}) supera el stock disponible (${it.stock})`, onClose: () => setAlert(null) });
        return;
      }
      if (prec <= 0) {
        setAlert({ type: 'error', title: 'Precio inválido', message: `"${it.nombre}" debe tener un precio mayor a 0`, onClose: () => setAlert(null) });
        return;
      }
      if (prec > 9999999) {
        setAlert({ type: 'error', title: 'Precio inválido', message: `"${it.nombre}" supera el máximo permitido ($9,999,999)`, onClose: () => setAlert(null) });
        return;
      }
      if (prec > 9999999) {
        setAlert({ type: 'error', title: 'Precio inválido', message: `"${it.nombre}" supera el máximo permitido ($9,999,999,999)`, onClose: () => setAlert(null) });
        return;
      }
    }

    // Validar fecha de vencimiento (antes de setSubmitting)
    const pagoMontoNum = Number(pagoMonto) || 0;
    const pagoCubreTotal = pagoMontoNum >= total;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (!pagoCubreTotal && !fechaVencimiento) {
      setAlert({ type: 'error', title: 'Fecha de vencimiento requerida', message: 'Si el pago inicial no cubre el total, debes asignar una fecha de vencimiento', onClose: () => setAlert(null) });
      return;
    }
    if (fechaVencimiento) {
      const selected = new Date(fechaVencimiento + 'T00:00:00');
      if (selected < hoy) {
        setAlert({ type: 'error', title: 'Fecha inválida', message: 'La fecha de vencimiento no puede ser anterior al día de hoy', onClose: () => setAlert(null) });
        return;
      }
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 2);
      if (selected > maxDate) {
        setAlert({ type: 'error', title: 'Fecha inválida', message: 'La fecha de vencimiento no puede superar los 2 meses a partir de hoy', onClose: () => setAlert(null) });
        return;
      }
    }

    setSubmitting(true);
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
    if (pagoMontoNum > 0) {
      payload.pagos = [{ monto: pagoMontoNum, metodo_pago: pagoMetodo }];
    }

    // Fecha de vencimiento
    if (fechaVencimiento) {
      payload.fecha_limite_pago = fechaVencimiento;
    }

    try {
      await addVenta(payload);
      setLoading(false);
      setAlert({
        type: 'success',
        title: 'Venta registrada',
        message: 'La venta se registró correctamente',
        onClose: () => { setAlert(null); onClose(); window.location.reload(); },
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
                maxLength={300}
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
              <div className={styles.itemsTableWrap}>
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
                          className={`${styles.itemInput} ${Number(it.cantidad) > Number(it.stock) ? styles.itemInputError : ''}`}
                          type="text"
                          inputMode="numeric"
                          value={it.cantidad}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            if (raw === '') {
                              updateItem(it.producto_id, 'cantidad', '');
                              return;
                            }
                            const num = parseInt(raw, 10);
                            if (!isNaN(num) && num >= 1) {
                              const maxVal = Math.max(1, Number(it.stock) || 999);
                              updateItem(it.producto_id, 'cantidad', Math.min(num, maxVal));
                            }
                          }}
                          onBlur={() => {
                            if (it.cantidad === '' || Number(it.cantidad) < 1) {
                              updateItem(it.producto_id, 'cantidad', 1);
                            }
                          }}
                        />
                        {Number(it.cantidad) > Number(it.stock) && (
                          <span className={styles.fieldError}>Supera el stock disponible ({it.stock})</span>
                        )}
                      </td>
                      <td>
                        <input
                          className={styles.itemInput}
                          type="text"
                          inputMode="numeric"
                          value={it.precio}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            if (raw === '') {
                              updateItem(it.producto_id, 'precio', '');
                              return;
                            }
                            const num = parseInt(raw, 10);
                            if (!isNaN(num) && num >= 1) {
                              updateItem(it.producto_id, 'precio', Math.min(num, 9999999999));
                            }
                          }}
                          onBlur={() => {
                            if (it.precio === '' || Number(it.precio) < 1) {
                              updateItem(it.producto_id, 'precio', 1);
                            }
                          }}
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
              </div>
            ) : (
              <div className={styles.emptyItems}>
                <FiSearch className={styles.emptyItemsIcon} />
                Busca y selecciona productos para agregarlos a la venta
              </div>
            )}
          </div>

          {/* ══ TOTALES ══ */}
          <div className={`${styles.section} ${items.length === 0 ? styles.sectionDisabled : ''}`}>
            <div className={styles.sectionTitle}>Totales</div>

            <div className={styles.field}>
              <label className={styles.label}>Descuento (%)</label>
              <div className={styles.discountWrap}>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="0"
                  value={descuento}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    if (raw === '') {
                      setDescuento('');
                      return;
                    }
                    const num = Number(raw);
                    if (!isNaN(num) && num >= 0) {
                      setDescuento(Math.min(num, 100));
                    }
                  }}
                />
                <span className={styles.discountSuffix}>%</span>
              </div>
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span className={styles.totalValue}>{fmt(subtotal)}</span>
              </div>
              {descuentoNum > 0 && (
                <div className={styles.totalRow}>
                  <span>Descuento ({descuentoNum}%)</span>
                  <span className={styles.totalValue} style={{ color: '#dc2626' }}>-{fmt(subtotal - total)}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
                <span>Total</span>
                <span className={styles.totalValueGrand}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ PAGO INICIAL (OPCIONAL) ══ */}
          <div className={`${styles.section} ${items.length === 0 ? styles.sectionDisabled : ''}`}>
            <div className={styles.sectionTitle}>Pago inicial (opcional)</div>
            <div className={styles.pagoRow}>
              <div className={styles.field}>
                <label className={styles.label}>Monto</label>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="0"
                  value={pagoMonto === '' ? '' : Number(pagoMonto).toFixed(2).replace(/\.?0+$/, '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    if (raw === '') {
                      setPagoMonto('');
                      return;
                    }
                    const num = Number(raw);
                    if (!isNaN(num) && num >= 0) {
                      const clamped = Math.min(num, total || 0);
                      console.warn('🧮 pagoMonto onChange:', { raw, num, clamped, total });
                      setPagoMonto(clamped);
                    }
                  }}
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

          {/* ══ FECHA DE VENCIMIENTO ══ */}
          {Number(pagoMonto || 0) < total && (
            <div className={`${styles.section} ${items.length === 0 ? styles.sectionDisabled : ''}`}>
              <div className={styles.sectionTitle}>Vencimiento</div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Fecha de vencimiento
                  <span style={{ color: '#dc2626' }}> *</span>
                </label>
                <input
                  className={styles.input}
                  type="date"
                  min={toLocalDateStr()}
                  max={toLocalDateStr(new Date(new Date().setMonth(new Date().getMonth() + 2)))}
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
                {!fechaVencimiento && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Obligatorio — el pago inicial no cubre el total</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Panel de registro de nuevo cliente */}
      <NewClientPanel
        isOpen={showClientForm}
        onClose={() => setShowClientForm(false)}
        onGuardar={handleCreateCliente}
      />

      {loading && createPortal(
        <LoadingOverlay title="Registrando venta…" message="Procesando la solicitud" />,
        document.body
      )}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
    </>
  );
};

export default VentaForm;
