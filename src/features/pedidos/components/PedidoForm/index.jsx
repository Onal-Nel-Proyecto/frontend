// ================================================================
// PedidoForm — Drawer para crear / editar un pedido
// ================================================================

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';

import { BiSolidUserDetail } from "react-icons/bi";
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import ClienteSearch from '../ClienteSearch';
import NewClientPanel from '../../../../features/Clientes/components/RegisterClient/RegisterClient';
import { createPedido, updatePedido } from '../../services/pedidosService';
import { createCliente } from '../../../../features/Clientes/services/clientesService';
import { getServerDate } from '../../../../utils/serverDate';
import styles from './PedidoForm.module.css';

const PedidoForm = ({ isOpen, onClose, pedido, origen = 'CLIENTE' }) => {
  const isEdit = !!pedido;
  const isProduccion = origen === 'PRODUCCION';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cliente_id: pedido?.cliente?.cliente_id || '',
    descripcion: pedido?.descripcion || '',
    observacion: pedido?.observacion || '',
    tipo_pedido: pedido?.tipo_pedido || '',
    fecha_entrega_estimada: pedido?.fecha_entrega_estimada || pedido?.fecha_estimada_entrega || pedido?.fecha_estimada || '',
    recordatorio_activo: !!pedido?.recordatorio,
    recordatorio: pedido?.recordatorio || 3,
  });

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Estado para el registro de nuevo cliente dentro del formulario
  const [showClientForm, setShowClientForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(null);
  const limits = {
    recordatorio: 10
  };

  /** Calcula el máximo de días de recordatorio permitido según la fecha de entrega */
  const getMaxRecordatorio = useCallback(() => {
    const absoluteMax = limits.recordatorio || 10;
    if (!form.fecha_entrega_estimada) return absoluteMax;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(form.fecha_entrega_estimada + 'T00:00:00');
    const diffTime = deliveryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Si la entrega es hoy o ya pasó, no se puede poner recordatorio
    if (diffDays <= 0) return 0;

    return Math.min(absoluteMax, diffDays);
  }, [form.fecha_entrega_estimada]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    let sanitizedValue = value;

    // Recordatorio: solo dígitos, nada de +-.,e
    if (name === 'recordatorio' && sanitizedValue !== '') {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, '');
      const numericValue = Number(sanitizedValue);
      if (numericValue < 1) {
        sanitizedValue = '1';
      } else {
        const maxRecordatorio = getMaxRecordatorio();
        if (maxRecordatorio > 0 && numericValue > maxRecordatorio) {
          sanitizedValue = String(maxRecordatorio);
        }
      }
    } else if (type === 'number' && sanitizedValue !== '') {
      const numericValue = Number(sanitizedValue);
      if (numericValue < 0) return;
      const max = limits[name];
      if (max && numericValue > max) return;
    }

    setForm((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Ajustar recordatorio cuando cambia la fecha de entrega
  useEffect(() => {
    if (form.recordatorio_activo && form.fecha_entrega_estimada) {
      const maxDias = getMaxRecordatorio();
      if (maxDias <= 0) {
        setForm((p) => ({ ...p, recordatorio_activo: false }));
      } else if (form.recordatorio > maxDias) {
        setForm((p) => ({ ...p, recordatorio: maxDias }));
      }
    }
  }, [form.fecha_entrega_estimada]);

  const handleClienteChange = useCallback((cliente) => {
    setForm((prev) => ({ ...prev, cliente_id: cliente.cliente_id }));
    setErrors((prev) => {
      if (!prev.cliente_id) return prev;
      const next = { ...prev };
      delete next.cliente_id;
      return next;
    });
  }, []);

  const handleAddCliente = useCallback(() => {
    // Abrir el panel de registro de cliente sin cerrar el formulario de pedido
    setShowClientForm(true);
  }, []);

  // Callback para NewClientPanel: crear el cliente vía API
  const handleCreateCliente = useCallback(async (clienteData) => {
    try {
      const resp = await createCliente(clienteData);
      const data = resp?.data || resp;
      if (resp?.status || data?.cliente_id) {
        const clienteInfo = {
          cliente_id: data.cliente_id || data.id,
          cliente_nombre: data.cliente_nombre || clienteData.cliente_nombre,
          cliente_apellido: data.cliente_apellido || clienteData.cliente_apellido || '',
        };
        // Actualizar el form con el nuevo cliente
        handleClienteChange(clienteInfo);
        // Guardar para que ClienteSearch muestre el nombre
        setNuevoCliente(clienteInfo);
        return { ok: true, data: resp };
      }
      return { ok: false, error: resp?.msg || 'Error al crear el cliente' };
    } catch (err) {
      return { ok: false, error: err?.response?.data?.error || 'Error al conectar con el servidor' };
    }
  }, [handleClienteChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isProduccion && !form.cliente_id) {
      setErrors({ cliente_id: 'Selecciona un cliente' });
      return;
    }

    if (isProduccion && !form.descripcion?.trim()) {
      setErrors({ descripcion: 'La descripción es requerida' });
      return;
    }

    if (isProduccion && !form.fecha_entrega_estimada) {
      setErrors({ fecha_entrega_estimada: 'La fecha estimada de finalización es requerida' });
      return;
    }

    // Ajustar recordatorio contra fecha de entrega (safety net, el UI ya controla esto)
    let recordatorio = null;
    if (form.recordatorio_activo && form.fecha_entrega_estimada) {
      const maxRecordatorio = getMaxRecordatorio();
      if (maxRecordatorio > 0) {
        recordatorio = Math.min(form.recordatorio, maxRecordatorio);
      }
    }

    setSubmitting(true);
    onClose();
    setLoading(true);

    const fechaEntrega = form.fecha_entrega_estimada || null;
    const payload = {
      descripcion: form.descripcion || null,
      observacion: form.observacion || null,
      [isEdit ? 'fecha_estimada_entrega' : 'fecha_estimada']: fechaEntrega,
    };
    if (isProduccion) {
      payload.tipo_de_origen = "PRODUCCION";
    } else {
      payload.cliente_id = form.cliente_id;
      payload.tipo_pedido = form.tipo_pedido || null;
      payload.recordatorio = recordatorio;
      payload.tipo_de_origen = "CLIENTE";
    }

    try {
      let resp;
      if (isEdit) {
        resp = await updatePedido(pedido.pedido_id, payload);
      } else {
        resp = await createPedido(payload);
      }

      setLoading(false);

      if (resp?.status) {
        const detailPath = isProduccion ? '/pedidos/orden-produccion/' : '/pedidos/';
        setAlert({
          type: 'success',
          title: isEdit ? (isProduccion ? 'Orden actualizada' : 'Pedido actualizado') : (isProduccion ? 'Orden registrada' : 'Pedido registrado'),
          message: resp.msg || `Se registró${isProduccion ? ' una nueva orden' : ' un nuevo pedido'} con el ID ${resp.data}`,
          onConfirm: () => {
            setAlert(null);
            if (!isEdit && resp.data) {
              navigate(`${detailPath}${resp.data}`);
            } else {
              window.location.reload();
            }
          },
          onClose: () => {
            setAlert(null);
            if (!isEdit && resp.data) {
              navigate(`${detailPath}${resp.data}`);
            } else {
              window.location.reload();
            }
          },
        });
      } else {
        setAlert({ type: 'error', title: 'Error', message: resp?.msg || 'Error al guardar el pedido', onClose: () => setAlert(null) });
      }
    } catch (err) {
      setLoading(false);
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach((e) => { if (e.path) mapped[e.path] = e.msg; });
        setErrors(mapped);
      }
      setAlert({ type: 'error', title: 'Error', message: err?.response?.data?.error || 'No se pudo guardar el pedido', onClose: () => setAlert(null) });
    } finally {
      setSubmitting(false);
    }
  };

  const [minDate, setMinDate] = useState(() => {
    const local = new Date();
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split('T')[0];
  });

  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    getServerDate().then(setMinDate);
  }, [isOpen]);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit
          ? (isProduccion ? 'Editar orden de producción' : 'Editar pedido')
          : (isProduccion ? 'Nueva orden de producción' : 'Nuevo pedido')
        }
        subtitle={isProduccion
          ? "Completa los datos para registrar una nueva orden de producción."
          : "Completa los datos para registrar un nuevo pedido en el sistema."
        }
        icon={<FiShoppingBag />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : (isProduccion ? 'Registrar orden' : 'Registrar pedido')}
            </button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {!isProduccion && (
            <div className={styles.field}>
              <label className={styles.label}>Cliente *</label>
              <ClienteSearch
                initialNombre={nuevoCliente
                  ? `${nuevoCliente.cliente_nombre} ${nuevoCliente.cliente_apellido}`.trim()
                  : pedido?.cliente?.cliente_nombres || ''}
                onChange={handleClienteChange}
                error={errors.cliente_id}
                onAddCliente={handleAddCliente}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Descripción {isProduccion ? '*' : ''}</label>
            <div className={styles.inputWrap}>
              <BiSolidUserDetail className={styles.inputIcon} />
              <input
                name="descripcion"
                className={`${styles.input} ${errors.descripcion ? styles.inputError : ''}`}
                placeholder={isProduccion ? "Describe la orden de producción…" : "Describe el pedido…"}
                value={form.descripcion}
                onChange={handleChange}
                maxLength={80}
              />
            </div>
            {errors.descripcion && (
              <span className={styles.fieldError}>{errors.descripcion}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Observación</label>
            <div className={styles.inputWrap}>
              <textarea
                name="observacion"
                className={styles.textarea}
                placeholder="Notas adicionales…"
                rows={3}
                value={form.observacion}
                onChange={handleChange}
                maxLength={300}
              />
            </div>
          </div>

          {!isProduccion && (
            <div className={styles.field}>
              <label className={styles.label}>Tipo de pedido</label>
              <select
                name="tipo_pedido"
                className={styles.select}
                value={form.tipo_pedido}
                onChange={handleChange}
              >
                <option value="">Seleccionar tipo…</option>
                <option value="personalizado">Personalizado</option>
                <option value="retoques">Retoques</option>
                <option value="modificaciones">Modificaciones</option>
              </select>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>
              {isProduccion ? 'Fecha estimada de finalización' : 'Fecha estimada de entrega'}
              {isProduccion ? ' *' : ''}
            </label>
            <div className={styles.inputWrap}>
              <input
                type="date"
                name="fecha_entrega_estimada"
                className={`${styles.input} ${errors.fecha_entrega_estimada ? styles.inputError : ''}`}
                value={form.fecha_entrega_estimada}
                onChange={handleChange}
                min={minDate}
                max={(() => {
                  const d = new Date();
                  d.setFullYear(d.getFullYear() + 1);
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  return d.toISOString().split('T')[0];
                })()}
                onBlur={() => {
                  if (!form.fecha_entrega_estimada) return;
                  const selected = form.fecha_entrega_estimada;
                  if (selected < minDate) {
                    setForm((p) => ({ ...p, fecha_entrega_estimada: minDate }));
                  } else {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() + 1);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    const maxStr = d.toISOString().split('T')[0];
                    if (selected > maxStr) {
                      setForm((p) => ({ ...p, fecha_entrega_estimada: maxStr }));
                    }
                  }
                }} />
            </div>
            {errors.fecha_entrega_estimada && (
              <span className={styles.fieldError}>{errors.fecha_entrega_estimada}</span>
            )}
          </div>

          {!isProduccion && form.fecha_entrega_estimada && getMaxRecordatorio() > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Recordatorio</label>
              <div className={styles.switchRow}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={form.recordatorio_activo}
                    onChange={() => {
                      const newActive = !form.recordatorio_activo;
                      const maxDias = getMaxRecordatorio();
                      const defaultVal = Math.min(3, maxDias);
                      setForm((p) => ({
                        ...p,
                        recordatorio_activo: newActive,
                        recordatorio: newActive ? defaultVal : p.recordatorio
                      }));
                    }} />
                  <span className={styles.slider} />
                </label>
                <span className={styles.switchLabel}>
                  {form.recordatorio_activo ? 'Activado' : 'Desactivado'}
                </span>
              </div>
              {form.recordatorio_activo && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={styles.recordatorioLabel}>Días antes</span>
                  <div className={styles.inputWrap}>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="recordatorio"
                      className={`${styles.input} ${errors.recordatorio ? styles.inputError : ''}`}
                      value={form.recordatorio}
                      onChange={handleChange}
                    />
                  </div>
                  <span className={styles.recordatorioHint}>
                    Máximo {getMaxRecordatorio()} día{getMaxRecordatorio() !== 1 ? 's' : ''} antes de la entrega
                  </span>
                  {errors.recordatorio && (
                    <span className={styles.fieldError}>{errors.recordatorio}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </Drawer>

      {/* Panel de registro de nuevo cliente (solo para pedidos de clientes) */}
      {!isProduccion && (
        <NewClientPanel
          isOpen={showClientForm}
          onClose={() => setShowClientForm(false)}
          onGuardar={handleCreateCliente}
        />
      )}

      {loading && <LoadingOverlay title="Guardando pedido…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose || (() => setAlert(null))} />}
    </>
  );
};

export default PedidoForm;
