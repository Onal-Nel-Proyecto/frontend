// ================================================================
// CategoriaForm — Drawer para crear / editar una categoría
// Replica la estructura visual de PedidoForm
// ================================================================

import { useState } from 'react';
import { FiGrid } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import { createCategoria, updateCategoria } from '../../../../services/categoriaService';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import styles from './CategoriaForm.module.css';

const STATUS_OPTIONS = ['ACTIVO', 'INACTIVO'];

const CategoriaForm = ({ isOpen, onClose, categoria, onSuccess }) => {
  const isEdit = !!categoria;

  const [form, setForm] = useState({
    catNom: categoria?.cat_nom || categoria?.nombre || '',
    catDesc: categoria?.cat_desc || categoria?.descripcion || '',
    catEst: categoria?.cat_est || categoria?.estado || 'ACTIVO',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.catNom || !form.catNom.trim()) {
      errs.catNom = 'El nombre es obligatorio';
    } else if (form.catNom.trim().length < 3) {
      errs.catNom = 'El nombre debe tener al menos 3 caracteres';
    } else if (form.catNom.trim().length > 50) {
      errs.catNom = 'El nombre debe tener máximo 50 caracteres';
    }
    if (form.catDesc && form.catDesc.length > 120) {
      errs.catDesc = 'La descripción debe tener máximo 120 caracteres';
    }
    if (!form.catEst) {
      errs.catEst = 'El estado es obligatorio';
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
    onClose();
    setLoading(true);

    const payload = {
      cat_nom: form.catNom.trim(),
      cat_desc: form.catDesc.trim() || null,
      cat_est: form.catEst,
    };

    try {
      let resp;
      if (isEdit) {
        resp = await updateCategoria(categoria.cat_id || categoria.id, payload);
      } else {
        resp = await createCategoria(payload);
      }

      setLoading(false);

      if (resp?.status) {
        setAlert({
          type: 'success',
          title: isEdit ? 'Categoría actualizada' : 'Categoría registrada',
          message: resp.msg || `La categoría se ${isEdit ? 'actualizó' : 'registró'} correctamente`,
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
          message: resp?.msg || 'Error al guardar la categoría',
          onClose: () => setAlert(null),
        });
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
        message: err?.response?.data?.error || 'No se pudo guardar la categoría',
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
        title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
        subtitle={isEdit ? 'Modifica los datos de la categoría.' : 'Completa los datos para registrar una nueva categoría.'}
        icon={<FiGrid />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar categoría'}
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
                name="catNom"
                className={`${styles.input} ${errors.catNom ? styles.inputError : ''}`}
                placeholder="Nombre de la categoría"
                value={form.catNom}
                onChange={handleChange}
                maxLength={50}
              />
            </div>
            {errors.catNom && <span className={styles.fieldError}>{errors.catNom}</span>}
          </div>

          {/* Descripción */}
          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <div className={styles.inputWrap}>
              <textarea
                name="catDesc"
                className={`${styles.textarea} ${errors.catDesc ? styles.inputError : ''}`}
                placeholder="Descripción de la categoría (opcional)"
                rows={3}
                value={form.catDesc}
                onChange={handleChange}
                maxLength={120}
              />
            </div>
            {errors.catDesc && <span className={styles.fieldError}>{errors.catDesc}</span>}
            <span className={styles.charCount}>{form.catDesc.length}/120</span>
          </div>

          {/* Estado */}
          <div className={styles.field}>
            <label className={styles.label}>Estado *</label>
            <div className={styles.inputWrap}>
              <select
                name="catEst"
                className={`${styles.select} ${errors.catEst ? styles.inputError : ''}`}
                value={form.catEst}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                  </option>
                ))}
              </select>
            </div>
            {errors.catEst && <span className={styles.fieldError}>{errors.catEst}</span>}
          </div>
        </form>
      </Drawer>

      {loading && <LoadingOverlay title="Guardando categoría…" message="Procesando la solicitud" />}
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

export default CategoriaForm;
