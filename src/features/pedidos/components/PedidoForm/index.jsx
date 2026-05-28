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
import { createPedido, updatePedido } from '../../services/pedidosService';
import styles from './PedidoForm.module.css';

const PedidoForm = ({ isOpen, onClose, pedido }) => {
  const isEdit = !!pedido;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cliente_id: pedido?.cliente?.cliente_id || '',
    descripcion: pedido?.descripcion || '',
    observacion: pedido?.observacion || '',
    fecha_estimada_entrega: pedido?.fecha_estimada_entrega || '',
    recordatorio_activo: !!pedido?.recordatorio,
    recordatorio: pedido?.recordatorio || 3,
  });

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const limits = {
    recordatorio: 10
  };
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number' && value !== '') {

      const numericValue = Number(value);

      if (numericValue < 0) return;

      const max = limits[name];

      if (max && numericValue > max) return;
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
    // Placeholder: redirigir a la página de creación de clientes
    // Puedes cambiar la ruta según tu implementación
    onClose();
    navigate('/config?tab=clientes');
  }, [navigate, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) {
      setErrors({ cliente_id: 'Selecciona un cliente' });
      return;
    }

    setSubmitting(true);
    onClose();
    setLoading(true);

    const payload = {
      cliente_id: form.cliente_id,
      descripcion: form.descripcion || null,
      observacion: form.observacion || null,
      fecha_estimada_entrega: form.fecha_estimada_entrega || null,
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
        setAlert({ type: 'error', title: 'Error', message: resp?.msg || 'Error al guardar el pedido' });
      }
    } catch (err) {
      setLoading(false);
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach((e) => { if (e.path) mapped[e.path] = e.msg; });
        setErrors(mapped);
      }
      setAlert({ type: 'error', title: 'Error', message: err?.response?.data?.error || 'No se pudo guardar el pedido' });
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
              initialNombre={pedido?.cliente?.cliente_nombres || ''}
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
            <label className={styles.label}>Fecha estimada de entrega</label>
            <div className={styles.inputWrap}>
              <input
                type="date"
                name="fecha_estimada_entrega"
                className={styles.input}
                value={form.fecha_estimada_entrega}
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
                  className={styles.input}
                  value={form.recordatorio}
                  onChange={handleChange}
                  min={1}
                  max={10}
                />
                <span className={styles.inputSuffix}>días antes</span>
              </div>
            )}
          </div>
        </form>
      </Drawer>

      {loading && <LoadingOverlay title="Guardando pedido…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose || (() => setAlert(null))} />}
    </>
  );
};

export default PedidoForm;
