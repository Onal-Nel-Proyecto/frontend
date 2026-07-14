// ================================================================
// CategoriaForm — Drawer para crear / editar una categoría
// Replica la estructura visual de PedidoForm
// ================================================================

import { useState, useEffect } from 'react';
import { FiGrid, FiPlus, FiX, FiHelpCircle } from 'react-icons/fi';
import { BiSolidUserDetail } from 'react-icons/bi';
import { createCategoria, updateCategoria } from '../../../../services/categoriaService';
import Drawer from '../../../../components/common/Drawer';
import Alert from '../../../../components/ui/feedback/Alert';
import LoadingOverlay from '../../../../components/ui/feedback/LoadingOverlay';
import styles from './CategoriaForm.module.css';

const STATUS_OPTIONS = ['ACTIVO', 'INACTIVO'];
const RESTRICCIONES_OPTIONS = ['SUPERIOR', 'INFERIOR', 'FALDA', 'VESTIDO', 'UNIFORME', 'GENERAL'];

const CategoriaForm = ({ isOpen, onClose, categoria, onSuccess }) => {
  const isEdit = !!categoria;

  const [form, setForm] = useState({
    catNom: categoria?.cat_nom || categoria?.nombre || '',
    catDesc: categoria?.cat_desc || categoria?.descripcion || '',
    catEst: categoria?.cat_est || categoria?.estado || 'ACTIVO',
  });

  // ─── Arrays de tags ───
  const [catTipsPrendas, setCatTipsPrendas] = useState([]);
  const [catTallaRef, setCatTallaRef] = useState([]);
  const [catRestMed, setCatRestMed] = useState([]);

  const [inputTips, setInputTips] = useState('');
  const [inputTalla, setInputTalla] = useState('');
  const [selectRestMed, setSelectRestMed] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Sincronizar el formulario cuando cambia la categoría a editar
  useEffect(() => {
    setForm({
      catNom: categoria?.cat_nom || categoria?.nombre || '',
      catDesc: categoria?.cat_desc || categoria?.descripcion || '',
      catEst: categoria?.cat_est || categoria?.estado || 'ACTIVO',
    });
    setCatTipsPrendas(
      categoria?.catTipsPrendas || categoria?.categoria_tipo_prenda || []
    );
    setCatTallaRef(
      categoria?.catTallaRef || categoria?.categoria_talla_referencia || []
    );
    setCatRestMed(
      categoria?.catRestMed || categoria?.restricciones_medidas || []
    );
    setInputTips('');
    setInputTalla('');
    setSelectRestMed('');
    setErrors({});
  }, [categoria]);

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

  // ─── Handlers para tags ───

  /** Solo letras (incluye acentos/ñ), sin números ni especiales */
  const agregarTipsPrenda = () => {
    const val = inputTips.trim().toUpperCase();
    if (!val) return;
    if (!/^[A-ZÁÉÍÓÚÜÑ]+$/.test(val)) return;
    if (catTipsPrendas.includes(val)) return;
    setCatTipsPrendas((prev) => [...prev, val]);
    setInputTips('');
  };

  const eliminarTipsPrenda = (item) => {
    setCatTipsPrendas((prev) => prev.filter((t) => t !== item));
  };

  /** Letras y números, sin especiales */
  const agregarTallaRef = () => {
    const val = inputTalla.trim().toUpperCase();
    if (!val) return;
    if (!/^[A-ZÁÉÍÓÚÜÑ0-9]+$/.test(val)) return;
    if (catTallaRef.includes(val)) return;
    setCatTallaRef((prev) => [...prev, val]);
    setInputTalla('');
  };

  const eliminarTallaRef = (item) => {
    setCatTallaRef((prev) => prev.filter((t) => t !== item));
  };

  const agregarRestMed = () => {
    if (!selectRestMed) return;
    if (catRestMed.includes(selectRestMed)) return;
    setCatRestMed((prev) => [...prev, selectRestMed]);
    setSelectRestMed('');
  };

  const eliminarRestMed = (item) => {
    setCatRestMed((prev) => prev.filter((t) => t !== item));
  };

  const handleKeyDownTips = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarTipsPrenda();
    }
  };

  const handleKeyDownTalla = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarTallaRef();
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
      catNom: form.catNom.trim(),
      catDesc: form.catDesc.trim() || null,
      catEst: form.catEst,
      catTipsPrendas: catTipsPrendas.length > 0 ? catTipsPrendas : null,
      catTallaRef: catTallaRef.length > 0 ? catTallaRef : null,
      catRestMed: catRestMed.length > 0 ? catRestMed : null,
    };

    try {
      let resp;
      if (isEdit) {
        resp = await updateCategoria(categoria.cat_id || categoria.id, payload);
      } else {
        resp = await createCategoria(payload);
      }

      if (resp?.status) {
        onClose();
        setLoading(true);
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
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        if (Array.isArray(serverErrors)) {
          // Formato: [{ path: "catNom", msg: "..." }]
          serverErrors.forEach((e) => {
            if (e.path) mapped[e.path] = e.msg;
          });
        } else {
          // Formato: { catTipsPrendas: ["..."], catTallaRef: ["..."], ... }
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

          {!isEdit && (
            <>
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
            </>
          )}

          {/* ─── Tipos de prenda (tags) ─── */}
          <div className={styles.field}>
            <label className={styles.label}>
              Tipos de prenda
              <span className={styles.tooltipIcon} title="Tipos de prenda que pertenecen a esta categoría. Solo letras, sin números ni caracteres especiales. Ej: CAMISA, PANTALÓN">
                <FiHelpCircle />
              </span>
            </label>
            <div className={styles.tagInputRow}>
              <input
                className={styles.tagInput}
                placeholder="Ej: CAMISA"
                value={inputTips}
                onChange={(e) => setInputTips(e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, '').toUpperCase())}
                onKeyDown={handleKeyDownTips}
                maxLength={20}
              />
              <button type="button" className={styles.tagAddBtn} onClick={agregarTipsPrenda} title="Agregar tipo de prenda">
                <FiPlus />
              </button>
            </div>
            {catTipsPrendas.length > 0 && (
              <div className={styles.tagsList}>
                {catTipsPrendas.map((item) => (
                  <span key={item} className={styles.tag}>
                    {item}
                    <button type="button" className={styles.tagRemove} onClick={() => eliminarTipsPrenda(item)}>
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.catTipsPrendas && <span className={styles.fieldError}>{errors.catTipsPrendas}</span>}
          </div>

          {/* ─── Tallas de referencia (tags) ─── */}
          <div className={styles.field}>
            <label className={styles.label}>
              Tallas de referencia
              <span className={styles.tooltipIcon} title="Tallas de referencia disponibles para esta categoría. Puede incluir números y letras, sin caracteres especiales. Ej: S, M, L, 38, 42">
                <FiHelpCircle />
              </span>
            </label>
            <div className={styles.tagInputRow}>
              <input
                className={styles.tagInput}
                placeholder="Ej: S, M, 38"
                value={inputTalla}
                onChange={(e) => setInputTalla(e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9]/g, '').toUpperCase())}
                onKeyDown={handleKeyDownTalla}
                maxLength={10}
              />
              <button type="button" className={styles.tagAddBtn} onClick={agregarTallaRef} title="Agregar talla de referencia">
                <FiPlus />
              </button>
            </div>
            {catTallaRef.length > 0 && (
              <div className={styles.tagsList}>
                {catTallaRef.map((item) => (
                  <span key={item} className={styles.tag}>
                    {item}
                    <button type="button" className={styles.tagRemove} onClick={() => eliminarTallaRef(item)}>
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.catTallaRef && <span className={styles.fieldError}>{errors.catTallaRef}</span>}
          </div>

          {/* ─── Restricciones de medidas (tags) ─── */}
          <div className={styles.field}>
            <label className={styles.label}>
              Restricciones de medidas
              <span className={styles.tooltipIcon} title="Restringe las medidas que aplican a esta categoría. Selecciona del listado las opciones correspondientes. Ej: SUPERIOR, INFERIOR">
                <FiHelpCircle />
              </span>
            </label>
            <div className={styles.tagInputRow}>
              <select
                className={styles.tagSelect}
                value={selectRestMed}
                onChange={(e) => setSelectRestMed(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {RESTRICCIONES_OPTIONS.filter((opt) => !catRestMed.includes(opt)).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button type="button" className={styles.tagAddBtn} onClick={agregarRestMed} title="Agregar restricción" disabled={!selectRestMed}>
                <FiPlus />
              </button>
            </div>
            {catRestMed.length > 0 && (
              <div className={styles.tagsList}>
                {catRestMed.map((item) => (
                  <span key={item} className={styles.tag}>
                    {item}
                    <button type="button" className={styles.tagRemove} onClick={() => eliminarRestMed(item)}>
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.catRestMed && <span className={styles.fieldError}>{errors.catRestMed}</span>}
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
