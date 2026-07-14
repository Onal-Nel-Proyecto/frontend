// ================================================================
// MedidaForm — Drawer para crear / editar una medida
// Replica la estructura visual de CategoriaForm / PedidoForm
// ================================================================

import { useState, useEffect } from 'react';
import { TfiRulerPencil } from 'react-icons/tfi';
import { BiSolidUserDetail } from 'react-icons/bi';
import { createMedida, updateMedida } from '../../../../services/medidasService';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import styles from './MedidaForm.module.css';

const STATUS_OPTIONS = ['ACTIVO', 'INACTIVO'];

const TIPO_OPTIONS = [
  { value: 'SUPERIOR', label: 'Superior' },
  { value: 'INFERIOR', label: 'Inferior' },
  { value: 'FALDA', label: 'Falda' },
  { value: 'VESTIDO', label: 'Vestido' },
  { value: 'UNIFORME', label: 'Uniforme' },
  { value: 'GENERAL', label: 'General' },
];

const MedidaForm = ({ isOpen, onClose, medida, onSuccess }) => {
  const isEdit = !!medida;

  const [form, setForm] = useState({
    medNom: medida?.med_nom || medida?.nombre || '',
    medDesc: medida?.med_desc || medida?.descripcion || '',
    medTipo: medida?.med_tipo || medida?.tipo_medida || '',
    medEst: medida?.med_est || medida?.estado || 'ACTIVO',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Sincronizar el formulario cuando cambia la medida a editar
  useEffect(() => {
    setForm({
      medNom: medida?.med_nom || medida?.nombre || '',
      medDesc: medida?.med_desc || medida?.descripcion || '',
      medTipo: medida?.med_tipo || medida?.tipo_medida || '',
      medEst: medida?.med_est || medida?.estado || 'ACTIVO',
    });
    setErrors({});
  }, [medida]);

  const validate = () => {
    const errs = {};
    if (!form.medNom || !form.medNom.trim()) {
      errs.medNom = 'El nombre es obligatorio';
    } else if (form.medNom.trim().length < 3) {
      errs.medNom = 'El nombre debe tener al menos 3 caracteres';
    } else if (form.medNom.trim().length > 50) {
      errs.medNom = 'El nombre debe tener máximo 50 caracteres';
    }
    if (form.medDesc && form.medDesc.length > 120) {
      errs.medDesc = 'La descripción debe tener máximo 120 caracteres';
    }
    if (!form.medTipo) {
      errs.medTipo = 'El tipo de medida es obligatorio';
    }
    if (!form.medEst) {
      errs.medEst = 'El estado es obligatorio';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    const payload = {
      medNom: form.medNom.trim(),
      medDesc: form.medDesc.trim() || null,
      medTipo: form.medTipo,
      medEst: form.medEst,
    };

    try {
      let resp;
      if (isEdit) {
        resp = await updateMedida(medida.med_id || medida.id, payload);
      } else {
        resp = await createMedida(payload);
      }

      if (resp?.status) {
        onClose();
        setLoading(true);
        setAlert({
          type: 'success',
          title: isEdit ? 'Medida actualizada' : 'Medida registrada',
          message: resp.msg || `La medida se ${isEdit ? 'actualizó' : 'registró'} correctamente`,
          onConfirm: () => {
            setAlert(null);
            onSuccess?.();
          },
          onClose: () => {
            setAlert(null);
            onSuccess?.();
          },
        });
      } else {
        setAlert({
          type: 'error',
          title: 'Error',
          message: resp?.msg || 'Error al guardar la medida',
          onClose: () => setAlert(null),
        });
      }
    } catch (err) {
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        if (Array.isArray(serverErrors)) {
          serverErrors.forEach((e) => {
            if (e.path) mapped[e.path] = e.msg;
          });
        } else {
          Object.entries(serverErrors).forEach(([key, msgs]) => {
            if (Array.isArray(msgs) && msgs.length > 0) {
              mapped[key] = msgs.join('. ');
            }
          });
        }
        setErrors(mapped);
      }
      setAlert({
        type: 'error',
        title: 'Error',
        message: err?.response?.data?.error || 'No se pudo guardar la medida',
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
        title={isEdit ? 'Editar medida' : 'Nueva medida'}
        subtitle={isEdit ? 'Modifica los datos de la medida.' : 'Completa los datos para registrar una nueva medida.'}
        icon={<TfiRulerPencil />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar medida'}
            </button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className={styles.field}>
            <label className={styles.label}>Nombre *</label>
            <div className={styles.inputWrap}>
              <BiSolidUserDetail className={styles.inputIcon} />
              <input
                name="medNom"
                className={`${styles.input} ${errors.medNom ? styles.inputError : ''}`}
                placeholder="Nombre de la medida"
                value={form.medNom}
                onChange={handleChange}
                maxLength={50}
              />
            </div>
            {errors.medNom && <span className={styles.fieldError}>{errors.medNom}</span>}
          </div>

          {/* Tipo de medida */}
          <div className={styles.field}>
            <label className={styles.label}>Tipo de medida *</label>
            <div className={styles.inputWrap}>
              <select
                name="medTipo"
                className={`${styles.select} ${errors.medTipo ? styles.inputError : ''}`}
                value={form.medTipo}
                onChange={handleChange}
              >
                <option value="">Seleccionar tipo</option>
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.medTipo && <span className={styles.fieldError}>{errors.medTipo}</span>}
          </div>

          {/* Descripción */}
          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <div className={styles.inputWrap}>
              <textarea
                name="medDesc"
                className={`${styles.textarea} ${errors.medDesc ? styles.inputError : ''}`}
                placeholder="Descripción de la medida (opcional)"
                rows={3}
                value={form.medDesc}
                onChange={handleChange}
                maxLength={120}
              />
            </div>
            {errors.medDesc && <span className={styles.fieldError}>{errors.medDesc}</span>}
            <span className={styles.charCount}>{form.medDesc.length}/120</span>
          </div>

          {!isEdit && (
            <>
              {/* Estado */}
              <div className={styles.field}>
                <label className={styles.label}>Estado *</label>
                <div className={styles.inputWrap}>
                  <select
                    name="medEst"
                    className={`${styles.select} ${errors.medEst ? styles.inputError : ''}`}
                    value={form.medEst}
                    onChange={handleChange}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.medEst && <span className={styles.fieldError}>{errors.medEst}</span>}
              </div>
            </>
          )}
        </form>
      </Drawer>

      {loading && <LoadingOverlay title="Guardando medida…" message="Procesando la solicitud" />}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={alert.onClose || (() => setAlert(null))}
        />
      )}
    </>
  );
};

export default MedidaForm;
