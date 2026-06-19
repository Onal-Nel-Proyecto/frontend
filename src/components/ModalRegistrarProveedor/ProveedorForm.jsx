import { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiMap, FiPlus, FiTrash2 } from 'react-icons/fi';

import Drawer from '../common/Drawer';
import Alert from '../ui/feedback/Alert';
import LoadingOverlay from '../ui/feedback/LoadingOverlay';

import { createProveedor, updateProveedor } from '../../features/proveedores/services/proveedor.services.js';

import styles from './ProveedorForm.module.css';

const SUPPLY_CATEGORIES = {
  'Materia prima': ['Tela', 'Hilo', 'Forro', 'Cierres'],
  Envases: ['Bolsas', 'Cajas', 'Etiquetas', 'Film'],
  Accesorios: ['Botones', 'Elásticos', 'Hilos', 'Hebillas'],
};

const ProveedorForm = ({ isOpen, onClose, proveedor, onSuccess }) => {
  const isEdit = !!proveedor;

  const [form, setForm] = useState({
    prov_nombre: '',
    prov_telefono: '',
    prov_correo: '',
    prov_direccion: '',
    prov_suministro: [],
    suministro_categoria: '',
    suministro_tipo: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (proveedor) {
      const currentSuministros = proveedor.prov_suministro || [];
      setForm({
        prov_nombre: proveedor.prov_nombre || '',
        prov_telefono: proveedor.prov_telefono || '',
        prov_correo: proveedor.prov_correo || '',
        prov_direccion: proveedor.prov_direccion || '',
        prov_suministro: currentSuministros,
        suministro_categoria: '',
        suministro_tipo: '',
      });
    } else {
      setForm({
        prov_nombre: '',
        prov_telefono: '',
        prov_correo: '',
        prov_direccion: '',
        prov_suministro: [],
        suministro_categoria: '',
        suministro_tipo: '',
      });
    }
  }, [proveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'prov_telefono') {
      newValue = value.replace(/\D/g, '');
    }

    if (name === 'prov_nombre') {
      newValue = value.replace(/[0-9]/g, '');
    }
    setForm((p) => ({ ...p, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const addSuministro = () => {
    const categoria = form.suministro_categoria;
    const tipo = form.suministro_tipo;

    if (!categoria) {
      setErrors((prev) => ({ ...prev, suministro_categoria: 'Selecciona una categoría' }));
      return;
    }

    if (!tipo) {
      setErrors((prev) => ({ ...prev, suministro_tipo: 'Selecciona un tipo de suministro' }));
      return;
    }

    const nuevoSuministro = `${categoria} - ${tipo}`;
    if (form.prov_suministro.includes(nuevoSuministro)) {
      setErrors((prev) => ({ ...prev, prov_suministro: 'Ya existe este suministro en la lista' }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      prov_suministro: [...prev.prov_suministro, nuevoSuministro],
      suministro_tipo: '',
    }));
    setErrors((prev) => ({ ...prev, prov_suministro: '', suministro_categoria: '', suministro_tipo: '' }));
  };

  const removeSuministro = (value) => {
    setForm((prev) => ({
      ...prev,
      prov_suministro: prev.prov_suministro.filter((item) => item !== value),
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    // Nombre
    if (!form.prov_nombre.trim()) {
      newErrors.prov_nombre = 'El nombre es requerido';
    } else if (/\d/.test(form.prov_nombre)) {
      newErrors.prov_nombre = 'El nombre no puede contener números';
    } else if (form.prov_nombre.length > 200) {
      newErrors.prov_nombre = 'El nombre es muy largo';
    }

    // Correo (opcional)
    if (form.prov_correo.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.prov_correo)) {
        newErrors.prov_correo = 'Correo inválido';
      } else if (form.prov_correo.length > 254) {
        newErrors.prov_correo = 'El correo no puede superar 254 caracteres';
      }
    }

    // Teléfono (opcional)
    if (form.prov_telefono.trim()) {
      if (!/^\d+$/.test(form.prov_telefono)) {
        newErrors.prov_telefono = 'El teléfono solo puede contener números';
      } else if (form.prov_telefono.length !== 10) {
        newErrors.prov_telefono = 'Debe contener exactamente 10 dígitos';
      }
    }

    // Dirección (opcional)
    if (
      form.prov_direccion.trim() &&
      form.prov_direccion.length > 300
    ) {
      newErrors.prov_direccion = 'La dirección es muy larga';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setLoading(true);

    const payload = {
      prov_nombre: form.prov_nombre,
      prov_telefono: form.prov_telefono,
      prov_correo: form.prov_correo,
      prov_direccion: form.prov_direccion,
      prov_suministro: Array.isArray(form.prov_suministro) ? form.prov_suministro : form.prov_suministro.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      let resp;
      if (isEdit) {
        resp = await updateProveedor(proveedor.prov_id, payload);
      } else {
        resp = await createProveedor(payload);
      }

      setAlert({ type: 'success', title: isEdit ? 'Proveedor actualizado' : 'Proveedor creado', message: resp?.msg || 'Operación realizada', onClose: () => setAlert(null) });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors && Array.isArray(serverErrors)) {
        const mapped = {};
        serverErrors.forEach((e) => { if (e.path) mapped[e.path] = e.msg; });
        setErrors(mapped);
      }

      setAlert({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'No se pudo guardar el proveedor', onClose: () => setAlert(null) });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
        subtitle="Completa todos los campos requeridos para continuar."
        icon={<FiUser />}
        footer={
          <>
            <button className={styles.btnOutline} onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>{submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar proveedor'}</button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.sectionTitle}>Datos del proveedor</p>

          <div className={styles.field}>
            <label className={styles.label}>Nombre *</label>
            <div className={styles.inputWrap}>
              <FiUser className={styles.inputIcon} />
              <input name="prov_nombre" maxLength={200} className={`${styles.input} ${errors.prov_nombre ? styles.inputError : ''}`} placeholder="Ej. Proveedor S.A" value={form.prov_nombre} onChange={handleChange} />
            </div>
            {errors.prov_nombre && <span className={styles.fieldError}>{errors.prov_nombre}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Teléfono </label>
            <div className={styles.inputWrap}>
              <FiPhone className={styles.inputIcon} />
              <input type="text" name="prov_telefono" maxLength={10} className={`${styles.input} ${errors.prov_telefono ? styles.inputError : ''}`} placeholder="3001234567" value={form.prov_telefono} onChange={handleChange} />
            </div>
            {errors.prov_telefono && <span className={styles.fieldError}>{errors.prov_telefono}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Correo </label>
            <div className={styles.inputWrap}>
              <FiMail className={styles.inputIcon} />
              <input type="email" name="prov_correo" maxLength={254} className={`${styles.input} ${errors.prov_correo ? styles.inputError : ''}`} placeholder="proveedor@correo.com" value={form.prov_correo} onChange={handleChange} />
            </div>
            {errors.prov_correo && <span className={styles.fieldError}>{errors.prov_correo}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Dirección</label>
            <div className={styles.inputWrap}>
              <FiMap className={styles.inputIcon} />
              <input name="prov_direccion" className={`${styles.input} ${errors.prov_direccion ? styles.inputError : ''}`} placeholder="Dirección del proveedor" value={form.prov_direccion} onChange={handleChange} />
            </div>
            {errors.prov_direccion && <span className={styles.fieldError}>{errors.prov_direccion}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Categoría de suministro</label>
            <select
              name="suministro_categoria"
              className={`${styles.select} ${errors.suministro_categoria ? styles.inputError : ''}`}
              value={form.suministro_categoria}
              onChange={(e) => handleChange(e)}
            >
              <option value="">Selecciona una categoría</option>
              {Object.keys(SUPPLY_CATEGORIES).map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
            {errors.suministro_categoria && <span className={styles.fieldError}>{errors.suministro_categoria}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tipo de suministro</label>
            <select
              name="suministro_tipo"
              className={`${styles.select} ${errors.suministro_tipo ? styles.inputError : ''}`}
              value={form.suministro_tipo}
              onChange={(e) => handleChange(e)}
              disabled={!form.suministro_categoria}
            >
              <option value="">Selecciona un tipo</option>
              {(SUPPLY_CATEGORIES[form.suministro_categoria] || []).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            {errors.suministro_tipo && <span className={styles.fieldError}>{errors.suministro_tipo}</span>}
          </div>

          <div className={styles.field}>
            <button type="button" className={styles.addButton} onClick={addSuministro}>
              <FiPlus /> Agregar suministro
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Suministros agregados</label>
            <div className={styles.chipContainer}>
              {form.prov_suministro.map((supply) => (
                <div key={supply} className={styles.chip}>
                  <span>{supply}</span>
                  <button type="button" className={styles.chipRemove} onClick={() => removeSuministro(supply)}>
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
            {errors.prov_suministro && <span className={styles.fieldError}>{errors.prov_suministro}</span>}
          </div>
        </form>
      </Drawer>

      {loading && <LoadingOverlay title="Guardando proveedor..." message="Procesando solicitud" />}

      {alert && <Alert type={alert.type} title={alert.title} message={alert.message} onClose={alert.onClose} />}
    </>
  );
};

export default ProveedorForm;
