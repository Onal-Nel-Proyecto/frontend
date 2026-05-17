// ================================================================
// DetallePanel — Drawer para ver / crear / editar un detalle
// ================================================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FiPackage,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import { createDetalle, updateDetalle } from '../../services/pedidosService';
import styles from './DetallePanel.module.css';

const medidasDisponibles = [
  { medida_id: 1, nombre: 'Pecho' },
  { medida_id: 2, nombre: 'Cintura' },
  { medida_id: 3, nombre: 'Cadera' },
  { medida_id: 4, nombre: 'Largo de manga' },
  { medida_id: 5, nombre: 'Largo total' },
];

const DetallePanel = ({ isOpen, onClose, modo, detalle }) => {
  const { id: pedidoId } = useParams();
  const isView = modo === 'view';
  const isCreate = modo === 'create';
  const [editMode, setEditMode] = useState(false);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resetear editMode cada vez que se abre el drawer
  useEffect(() => {
    if (isOpen) {
      setEditMode(isCreate);
    }
  }, [isOpen, isCreate]);

  const [form, setForm] = useState({
    producto_nombre: detalle?.producto?.nombre || '',
    producto_precio: detalle?.producto?.precio || '',
    producto_categoria_id: detalle?.producto?.categoria_id || '',
    cantidad: detalle?.cantidad || 1,
    observacion: detalle?.observacion || '',
    medidas: detalle?.medidas?.map((m) => ({
      medida_id: m.medida_id,
      nombre: m.medida_nombre || '',
      valor: m.medida_valor,
    })) || [],
  });

  // Actualizar form cuando cambia el detalle
  useEffect(() => {
    setForm({
      producto_nombre: detalle?.producto?.nombre || '',
      producto_precio: detalle?.producto?.precio || '',
      producto_categoria_id: detalle?.producto?.categoria_id || '',
      cantidad: detalle?.cantidad || 1,
      observacion: detalle?.observacion || '',
      medidas: detalle?.medidas?.map((m) => ({
        medida_id: m.medida_id,
        nombre: m.medida_nombre || '',
        valor: m.medida_valor,
      })) || [],
    });
  }, [detalle]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMedidaChange = (index, field, value) => {
    const nuevas = [...form.medidas];
    nuevas[index] = { ...nuevas[index], [field]: value };
    setForm((prev) => ({ ...prev, medidas: nuevas }));
  };

  const agregarMedida = () => {
    setForm((prev) => ({
      ...prev,
      medidas: [...prev.medidas, { medida_id: '', nombre: '', valor: '' }],
    }));
  };

  const eliminarMedida = (index) => {
    setForm((prev) => ({
      ...prev,
      medidas: prev.medidas.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validar
    const errs = {};
    if (!form.producto_nombre) errs.producto_nombre = 'El nombre del producto es obligatorio';
    if (!form.cantidad || form.cantidad < 1) errs.cantidad = 'La cantidad debe ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    onClose();
    setLoading(true);

    const medidas = form.medidas
      .filter((m) => m.medida_id && m.valor)
      .map((m) => ({ medida_id: Number(m.medida_id), medida_valor: Number(m.valor) }));

    const payload = {
      producto: {
        nombre: form.producto_nombre,
        precio: form.producto_precio ? Number(form.producto_precio) : null,
        categoria_id: form.producto_categoria_id ? Number(form.producto_categoria_id) : null,
      },
      cantidad: Number(form.cantidad),
      observacion: form.observacion || null,
      medidas,
    };

    try {
      let resp;
      if (isCreate) {
        resp = await createDetalle(pedidoId, payload);
      } else {
        resp = await updateDetalle(pedidoId, detalle.detalle_id, payload);
      }

      setLoading(false);
      if (resp?.status) {
        setAlert({
          type: 'success',
          title: isCreate ? 'Detalle registrado' : 'Detalle actualizado',
          message: resp.msg || 'Operación exitosa',
          onClose: () => { setAlert(null); window.location.reload(); },
        });
      } else {
        setAlert({ type: 'error', title: 'Error', message: resp?.msg || 'Error al guardar' });
      }
    } catch (err) {
      setLoading(false);
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach((e) => {
          if (e.path) mapped[e.path] = e.msg;
        });
        setErrors(mapped);
      }
      setAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo guardar el detalle',
        onClose: () => setAlert(null),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Modo vista ───
  if (isView && !editMode) {
    return (
      <>
        <Drawer
          isOpen={isOpen}
          onClose={onClose}
          title="Detalle del pedido"
          subtitle={`ID: ${detalle?.detalle_id || ''}`}
          icon={<FiPackage />}
          footer={
            <button className={styles.btnEdit} onClick={() => setEditMode(true)}>
              <FiEdit2 /> Editar detalle
            </button>
          }
        >
          <div className={styles.viewContent}>
            <div className={styles.viewId}>{detalle?.detalle_id}</div>

            <section className={styles.viewSection}>
              <h4 className={styles.viewSectionTitle}>Datos del producto</h4>
              <div className={styles.viewGrid}>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Nombre</span>
                  <span className={styles.viewValue}>{detalle?.producto?.nombre || '—'}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Cantidad</span>
                  <span className={styles.viewValue}>{detalle?.cantidad || '—'}</span>
                </div>
                <div className={styles.viewItem}>
                  <span className={styles.viewLabel}>Precio</span>
                  <span className={styles.viewValue}>
                    ${parseFloat(detalle?.producto?.precio || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.viewSection}>
              <h4 className={styles.viewSectionTitle}>Observación</h4>
              <p className={styles.viewObs}>{detalle?.observacion || 'Sin observación'}</p>
            </section>

            <section className={styles.viewSection}>
              <h4 className={styles.viewSectionTitle}>Medidas</h4>
              {(detalle?.medidas?.length || 0) > 0 ? (
                <div className={styles.medidasGrid}>
                  {detalle.medidas.map((m, i) => (
                    <div key={i} className={styles.medidaItem}>
                      <span className={styles.medidaNombre}>{m.medida_nombre || `Medida ${i + 1}`}</span>
                      <span className={styles.medidaValor}>{m.medida_valor} cm</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.viewObs}>Sin medidas registradas</p>
              )}
            </section>
          </div>
        </Drawer>

        {loading && <LoadingOverlay title="Guardando detalle…" message="Procesando la solicitud" />}
        {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
      </>
    );
  }

  // ─── Modo crear / editar ───
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isCreate ? 'Añadir detalle' : 'Editar detalle'}
        subtitle="Completa los datos del producto y sus medidas."
        icon={<FiPackage />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className={styles.btnSave} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : isCreate ? 'Registrar detalle' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          <section className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Datos del producto</h4>
            <div className={styles.field}>
              <label className={styles.label}>Nombre del producto *</label>
              <input
                name="producto_nombre"
                className={`${styles.input} ${errors.producto_nombre ? styles.inputError : ''}`}
                value={form.producto_nombre}
                onChange={handleChange}
                placeholder="Ej: Camisa Oxford"
              />
              {errors.producto_nombre && <span className={styles.fieldError}>{errors.producto_nombre}</span>}
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Cantidad</label>
                <input
                  name="cantidad"
                  type="number"
                  className={`${styles.input} ${errors.cantidad ? styles.inputError : ''}`}
                  value={form.cantidad}
                  onChange={handleChange}
                  min={1}
                />
                {errors.cantidad && <span className={styles.fieldError}>{errors.cantidad}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Precio</label>
                <input
                  name="producto_precio"
                  type="number"
                  step="0.01"
                  className={styles.input}
                  value={form.producto_precio}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </section>

          <section className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Observación</h4>
            <textarea
              name="observacion"
              className={styles.textarea}
              value={form.observacion}
              onChange={handleChange}
              placeholder="Notas adicionales…"
              rows={2}
            />
          </section>

          <section className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Medidas</h4>
            {form.medidas.map((m, i) => (
              <div key={i} className={styles.medidaRow}>
                <select
                  className={styles.select}
                  value={m.medida_id}
                  onChange={(e) => handleMedidaChange(i, 'medida_id', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {medidasDisponibles.map((md) => (
                    <option key={md.medida_id} value={md.medida_id}>{md.nombre}</option>
                  ))}
                </select>
                <div className={styles.medidaInputWrap}>
                  <input
                    type="number"
                    step="0.1"
                    className={styles.input}
                    placeholder="Valor"
                    value={m.valor}
                    onChange={(e) => handleMedidaChange(i, 'valor', e.target.value)}
                  />
                  <span className={styles.inputSuffix}>cm</span>
                </div>
                <button className={styles.btnRemove} onClick={() => eliminarMedida(i)} title="Descartar medida">
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <button className={styles.btnAddMedida} onClick={agregarMedida}>
              <FiPlus /> Añadir medida
            </button>
          </section>
        </div>
      </Drawer>

      {loading && <LoadingOverlay title="Guardando detalle…" message="Procesando la solicitud" />}
      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
    </>
  );
};

export default DetallePanel;
