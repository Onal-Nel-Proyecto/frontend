// ================================================================
// PedidoForm — Drawer para crear / editar un pedido
// ================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiUser } from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { createPedido, updatePedido } from '../../services/pedidosService';
import styles from './PedidoForm.module.css';

const clientesMock = [
  { id: '8765432109', nombre: 'Jorge Luis Parra Herrera' },
  { id: '9876543210', nombre: 'Maria Elena Ruiz Castillo' },
];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

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
            <div className={styles.inputWrap}>
              <FiUser className={styles.inputIcon} />
              <select
                name="cliente_id"
                className={`${styles.select} ${errors.cliente_id ? styles.inputError : ''}`}
                value={form.cliente_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar cliente…</option>
                {clientesMock.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            {errors.cliente_id && <span className={styles.fieldError}>{errors.cliente_id}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <div className={styles.inputWrap}>
              <input name="descripcion" className={styles.input} placeholder="Describe el pedido…" value={form.descripcion} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Observación</label>
            <div className={styles.inputWrap}>
              <textarea name="observacion" className={styles.textarea} placeholder="Notas adicionales…" rows={3} value={form.observacion} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Fecha estimada de entrega</label>
            <div className={styles.inputWrap}>
              <input type="date" name="fecha_estimada_entrega" className={styles.input} value={form.fecha_estimada_entrega} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Recordatorio</label>
            <div className={styles.switchRow}>
              <label className={styles.switch}>
                <input type="checkbox" checked={form.recordatorio_activo} onChange={() => setForm((p) => ({ ...p, recordatorio_activo: !p.recordatorio_activo }))} />
                <span className={styles.slider} />
              </label>
              <span className={styles.switchLabel}>{form.recordatorio_activo ? 'Activado' : 'Desactivado'}</span>
            </div>
            {form.recordatorio_activo && (
              <div className={styles.inputWrap} style={{ marginTop: '0.5rem' }}>
                <input type="number" name="recordatorio" className={styles.input} value={form.recordatorio} onChange={handleChange} min={1} />
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
