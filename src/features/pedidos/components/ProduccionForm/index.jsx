// ================================================================
// ProduccionForm — Drawer para iniciar producción en un detalle
// Muestra select con detalles pendientes (los que aún necesitan
// producción) y campo de cantidad.
// ================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FiPlay, FiPackage } from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { createProduccion } from '../../services/pedidosService';
import styles from './ProduccionForm.module.css';

/** Calcula los detalles que aún requieren producción */
const calcularDetallesPendientes = (detalles) => {
  if (!detalles || detalles.length === 0) return [];

  return detalles
    .map((d) => {
      const producciones = d.in_produccion || [];
      // Cantidad total ya cubierta por producciones NO canceladas
      const producido = producciones
        .filter((p) => p.estado?.toUpperCase() !== 'CANCELADO')
        .reduce((sum, p) => sum + (p.cantidad || 0), 0);

      const pendiente = (d.cantidad || 0) - producido;
      return { ...d, producido, pendiente };
    })
    .filter((d) => d.pendiente > 0); // solo los que faltan
};

const ProduccionForm = ({ isOpen, onClose, detalles, onSuccess }) => {
  const { id: pedidoId } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const detallesPendientes = calcularDetallesPendientes(detalles);
  const [form, setForm] = useState({
    detalle_id: '',
    cantidad: 1,
  });

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      const pendientes = calcularDetallesPendientes(detalles);
      setForm({
        detalle_id: pendientes[0]?.detalle_id || '',
        cantidad: pendientes[0]?.pendiente || 1,
      });
    }
  }, [isOpen, detalles]);

  const detalleSeleccionado = detallesPendientes.find((d) => d.detalle_id === form.detalle_id);

  const handleSubmit = async () => {
    if (!form.detalle_id) {
      setAlert({ type: 'error', title: 'Error', message: 'Selecciona un detalle', onClose: () => setAlert(null) });
      return;
    }
    const cant = Number(form.cantidad);
    if (!form.cantidad || isNaN(cant) || cant < 1) {
      setAlert({ type: 'error', title: 'Error', message: 'La cantidad debe ser mayor a 0', onClose: () => setAlert(null) });
      return;
    }
    if (cant > 99999) {
      setAlert({ type: 'error', title: 'Error', message: 'Cantidad demasiado alta', onClose: () => setAlert(null) });
      return;
    }
    if (cant > (detalleSeleccionado?.pendiente || 0)) {
      setAlert({ type: 'error', title: 'Error', message: `Solo faltan ${detalleSeleccionado?.pendiente} por producir`, onClose: () => setAlert(null) });
      return;
    }

    setSubmitting(true);
    onClose();
    setLoading(true);

    try {
      const resp = await createProduccion(pedidoId, form.detalle_id, {
        cantidad: Number(form.cantidad),
        detalle_id: form.detalle_id,
        producto_id: detalleSeleccionado?.producto?.producto_id || '',
      });
      if (!mountedRef.current) return;
      setLoading(false);
      if (resp?.status) {
        setAlert({
          type: 'success',
          title: 'Producción iniciada',
          message: resp.msg || 'Producción registrada correctamente',
          onClose: () => { setAlert(null); window.location.reload(); },
        });
      } else {
        setAlert({ type: 'error', title: 'Error', message: resp?.msg || 'Error al iniciar producción', onClose: () => setAlert(null) });
      }
    } catch (err) {
      setLoading(false);
      setAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo iniciar la producción',
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
        title="Iniciar producción"
        subtitle="Selecciona el detalle y la cantidad a producir."
        icon={<FiPackage />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting || detallesPendientes.length === 0}>
              {submitting ? 'Iniciando…' : 'Iniciar producción'}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          {/* Select de detalle */}
          <div className={styles.field}>
            <label className={styles.label}>Detalle a producir</label>
            <select
              className={styles.select}
              value={form.detalle_id}
              onChange={(e) => {
                const sel = detallesPendientes.find((d) => d.detalle_id === e.target.value);
                setForm({ detalle_id: e.target.value, cantidad: sel?.pendiente || 1 });
              }}
            >
              {detallesPendientes.length === 0 && <option value="">Sin detalles pendientes</option>}
              {detallesPendientes.map((d) => (
                <option key={d.detalle_id} value={d.detalle_id}>
                  {d.producto?.nombre || d.detalle_id} — falta {d.pendiente} uds
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className={styles.field}>
            <label className={styles.label}>Cantidad a producir</label>
            <input
              type="text"
              inputMode="numeric"
              className={styles.input}
              value={form.cantidad}
              onChange={(e) => {
                // Solo dígitos, sin signos ni letras
                const digits = e.target.value.replace(/[^0-9]/g, '');
                // Eliminar ceros a la izquierda (ej: "011" → "11")
                const cleaned = digits.replace(/^0+(?!$)/, '');
                if (cleaned === '') {
                  setForm((p) => ({ ...p, cantidad: '' }));
                  return;
                }
                const num = Number(cleaned);
                const max = Math.min(detalleSeleccionado?.pendiente || 1, 99999);
                setForm((p) => ({ ...p, cantidad: Math.min(num, max) }));
              }}
              onBlur={() => {
                setForm((p) => {
                  let val = p.cantidad;
                  if (val === '' || val === 0 || isNaN(Number(val)) || Number(val) < 1) {
                    val = 1;
                  }
                  const max = Math.min(detalleSeleccionado?.pendiente || 1, 99999);
                  if (Number(val) > max) {
                    val = max;
                  }
                  return { ...p, cantidad: val };
                });
              }}
            />
            {detalleSeleccionado && (
              <span className={styles.hint}>
                Máximo disponible: {detalleSeleccionado.pendiente} uds
              </span>
            )}
          </div>
        </div>
      </Drawer>

      {loading && <LoadingOverlay title="Iniciando producción…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
    </>
  );
};

export default ProduccionForm;
