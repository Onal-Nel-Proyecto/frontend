// ================================================================
// PedidoForm — Drawer para crear / editar un pedido
// ================================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';

import { BiSolidUserDetail } from "react-icons/bi";
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import ClienteSearch from '../ClienteSearch';
import NewClientPanel from '../../../../page/RegisterClient';
import { createPedido, updatePedido } from '../../services/pedidosService';
import { createCliente } from '../../../../api/clientesService';
import styles from './PedidoForm.module.css';

const PedidoForm = ({ isOpen, onClose, pedido }) => {
  const isEdit = !!pedido;
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
    if (type === 'number' && value !== '') {

      const numericValue = Number(value);

      if (numericValue < 0) return;

      // Validación dinámica contra fecha de entrega
      if (name === 'recordatorio') {
        const maxRecordatorio = getMaxRecordatorio();
        if (maxRecordatorio > 0 && numericValue > maxRecordatorio) return;
        if (numericValue < 1) return;
      } else {
        const max = limits[name];
        if (max && numericValue > max) return;
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

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
          cliente_id: data.cliente_id,
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
    if (!form.cliente_id) {
      setErrors({ cliente_id: 'Selecciona un cliente' });
      return;
    }

    // Validar recordatorio contra fecha de entrega
    if (form.recordatorio_activo && form.fecha_entrega_estimada) {
      const maxRecordatorio = getMaxRecordatorio();
      if (maxRecordatorio <= 0) {
        setErrors({ recordatorio: 'La fecha de entrega debe ser posterior a hoy para activar el recordatorio' });
        return;
      }
      if (form.recordatorio > maxRecordatorio) {
        setErrors({ recordatorio: `El recordatorio no puede superar los ${maxRecordatorio} días antes de la entrega` });
        return;
      }
    }

    setSubmitting(true);
    onClose();
    setLoading(true);

    const fechaEntrega = form.fecha_entrega_estimada || null;
    const payload = {
      cliente_id: form.cliente_id,
      descripcion: form.descripcion || null,
      observacion: form.observacion || null,
      tipo_pedido: form.tipo_pedido || null,
      [isEdit ? 'fecha_estimada_entrega' : 'fecha_estimada']: fechaEntrega,
      recordatorio: form.recordatorio_activo ? form.recordatorio : null,
    };

    try {
      let resp;
      if (isEdit) {
        resp = await updatePedido(pedido.pedido_id, payload);
      } else {
        resp = await createPedido(payload);
      }

      setLoading(false);

      if (resp?.status) {
        setAlert({
          type: 'success',
          title: isEdit ? 'Pedido actualizado' : 'Pedido registrado',
          message: resp.msg || `Se registró un nuevo pedido con el ID ${resp.data}`,
          onConfirm: () => {
            setAlert(null);
            if (!isEdit && resp.data) {
              navigate(`/pedidos/${resp.data}`);
            } else {
              window.location.reload();
            }
          },
          onClose: () => {
            setAlert(null);
            if (!isEdit && resp.data) {
              navigate(`/pedidos/${resp.data}`);
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

  const today = new Date();

  today.setMinutes(
    today.getMinutes() - today.getTimezoneOffset()
  );

  const minDate = today.toISOString().split('T')[0];

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Editar pedido' : 'Nuevo pedido'}
        subtitle="Completa los datos para registrar un nuevo pedido en el sistema."
        icon={<FiShoppingBag />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar pedido'}
            </button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
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

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <div className={styles.inputWrap}>
              <BiSolidUserDetail className={styles.inputIcon} />
              <input
                name="descripcion"
                className={styles.input}
                placeholder="Describe el pedido…"
                value={form.descripcion}
                onChange={handleChange}
                maxLength={80}
              />
            </div>
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

          <div className={styles.field}>
            <label className={styles.label}>Fecha estimada de entrega</label>
            <div className={styles.inputWrap}>
              <input
                type="date"
                name="fecha_entrega_estimada"
                className={styles.input}
                value={form.fecha_entrega_estimada}
                onChange={handleChange}
                min={minDate} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Recordatorio</label>
            <div className={styles.switchRow}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={form.recordatorio_activo}
                  onChange={() => setForm((p) => ({ ...p, recordatorio_activo: !p.recordatorio_activo }))} />
                <span className={styles.slider} />
              </label>
              <span
                className={styles.switchLabel}>
                {form.recordatorio_activo ? 'Activado' : 'Desactivado'}
              </span>
            </div>
            {form.recordatorio_activo && (
              <div className={styles.inputWrap} style={{ marginTop: '0.5rem' }}>

                <input
                  type="number"
                  name="recordatorio"
                  className={`${styles.input} ${errors.recordatorio ? styles.inputError : ''}`}
                  value={form.recordatorio}
                  onChange={handleChange}
                  min={1}
                  max={getMaxRecordatorio() || 1}
                />
                <span className={styles.inputSuffix}>días antes</span>
              </div>
            )}
            {form.recordatorio_activo && form.fecha_entrega_estimada && (
              <span style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.2rem', display: 'block' }}>
                Máximo {getMaxRecordatorio()} día{getMaxRecordatorio() !== 1 ? 's' : ''} antes de la entrega
              </span>
            )}
            {errors.recordatorio && (
              <span className={styles.fieldError}>{errors.recordatorio}</span>
            )}
          </div>
        </form>
      </Drawer>

      {/* Panel de registro de nuevo cliente (se superpone sin cerrar el drawer) */}
      <NewClientPanel
        isOpen={showClientForm}
        onClose={() => setShowClientForm(false)}
        onGuardar={handleCreateCliente}
      />

      {loading && <LoadingOverlay title="Guardando pedido…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose || (() => setAlert(null))} />}
    </>
  );
};

export default PedidoForm;
