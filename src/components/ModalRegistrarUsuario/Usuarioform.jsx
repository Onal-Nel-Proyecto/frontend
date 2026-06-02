// ================================================================
// UsuarioForm — Drawer para crear / editar un usuario
// ================================================================

import { useState, useEffect } from 'react';
import {
  FiUser,
  FiHash,
  FiPhone,
  FiMail,
  FiLock,
  FiShield,
  FiUsers,
} from 'react-icons/fi';

import Drawer from '../common/Drawer';
import Alert from '../../components/ui/feedback/Alert';
import LoadingOverlay from '../../components/ui/feedback/LoadingOverlay';

import {
  createUsuario,
  updateUsuario,
} from '../../features/usuarios/services/user.services.js';

import styles from './UsuarioForm.module.css';

const UsuarioForm = ({
  isOpen,
  onClose,
  usuario,
  onSuccess,
}) => {

  const isEdit = !!usuario;

  // ─────────────────────────────────────────
  // Estados
  // ─────────────────────────────────────────

 const [form, setForm] = useState({
  usuId: usuario?.id || '',
  usuNom: usuario?.nombres || '',
  usuApe: usuario?.apellidos || '',
  usuTel: usuario?.telefono || '',
  usuCor: usuario?.correo || '',
  usuPassHash: '',
  usuRol: usuario?.rol || 'USUARIO',
  usuSupFk: '',
  usuEst: usuario?.estado === 1 ? 'Activo' : 'Bloqueado',
});

  const [alert,      setAlert]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});

 useEffect(() => {

  if (usuario) {

    setForm({
      usuId: usuario.id || '',
      usuNom: usuario.nombres || '',
      usuApe: usuario.apellidos || '',
      usuTel: usuario.telefono || '',
      usuCor: usuario.correo || '',
      usuPassHash: '',
      usuRol: usuario.rol || 'USUARIO',
      usuSupFk: '',
      usuEst: usuario.estado === 1
        ? 'Activo'
        : 'Bloqueado',
    });

  } else {

    setForm({
      usuId: '',
      usuNom: '',
      usuApe: '',
      usuTel: '',
      usuCor: '',
      usuPassHash: '',
      usuRol: 'USUARIO',
      usuSupFk: '',
      usuEst: 'Activo',
    });

  }

}, [usuario]);
  // ─────────────────────────────────────────
  // Handle Change
  // ─────────────────────────────────────────

   const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'usuId')    newValue = value.replace(/\D/g, '');
    if (name === 'usuTel')   newValue = value.replace(/\D/g, '');
    if (name === 'usuSupFk') newValue = value.replace(/\D/g, '');
    if (name === 'usuNom')   newValue = value.replace(/[0-9]/g, '');
    if (name === 'usuApe')   newValue = value.replace(/[0-9]/g, '');
    setForm((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ─────────────────────────────────────────
  // Validaciones
  // ─────────────────────────────────────────

  const validate = () => {

    const newErrors = {};

    // ID
    if (!form.usuId.trim()) {

      newErrors.usuId =
        'La identificación es requerida';

    } else if (!/^\d+$/.test(form.usuId)) {

      newErrors.usuId =
        'Solo se permiten números';

    }

    // Nombre
    if (!form.usuNom.trim()) {

  newErrors.usuNom =
    'El nombre es requerido';

} else if (/\d/.test(form.usuNom)) {

  newErrors.usuNom =
    'El nombre no puede contener números';

} else if (form.usuNom.length < 2) {

  newErrors.usuNom =
    'El nombre es muy corto';

}

    // Apellido
    if (!form.usuApe.trim()) {

  newErrors.usuApe =
    'El apellido es requerido';

} else if (/\d/.test(form.usuApe)) {

  newErrors.usuApe =
    'El apellido no puede contener números';

} else if (form.usuApe.length < 2) {

  newErrors.usuApe =
    'El apellido es muy corto';

}

    // Correo
    if (!form.usuCor.trim()) {

      newErrors.usuCor =
        'El correo es requerido';

    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.usuCor)
    ) {

      newErrors.usuCor =
        'Correo inválido';

    }

    // Contraseña
    if (!isEdit && !form.usuPassHash.trim()) {

      newErrors.usuPassHash =
        'La contraseña es requerida';

    } else if (
      !isEdit &&
      form.usuPassHash.length < 6
    ) {

      newErrors.usuPassHash =
        'Mínimo 6 caracteres';

    }

    return newErrors;
  };

  // ─────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────

  const handleSubmit = async (e) => {

    e?.preventDefault();

    const validationErrors = validate();

    if (
      Object.keys(validationErrors).length > 0
    ) {

      setErrors(validationErrors);

      return;
    }

    setSubmitting(true);

    setLoading(true);

    // Payload al backend
        const payload = {
      id:           Number(form.usuId),
      nombres:      form.usuNom,
      apellidos:    form.usuApe,
      telefono:     form.usuTel,
      correo:       form.usuCor,
      password:     form.usuPassHash || undefined,
      rolId:        form.usuRol === 'ADMINISTRADOR' ? 1 : 2,
      supervisorId: form.usuSupFk ? String(form.usuSupFk) : null,
    };
    try {

      let resp;

      // EDITAR
      if (isEdit) {

        resp = await updateUsuario(usuario.id, payload);
         console.log('Usuario actualizado');
      } else {
        // CREAR
        resp = await createUsuario(payload);
        console.log('Usuario creado');

      }

      // ───────────────────────────
      // SUCCESS
      // ───────────────────────────

      setLoading(false);
      setAlert({
        type:    'success',
        title:   isEdit ? 'Usuario actualizado' : 'Usuario registrado',
        message: resp?.msg || 'Operación realizada correctamente',
        onClose: () => setAlert(null),
      });

      // actualizar tabla automáticamente
      if (onSuccess) {

        onSuccess();

      }

      // cerrar drawer
      onClose();

      

    }catch (err) {
  console.error('Error completo:', err);

  if (err.response) {
    console.log('Status:', err.response.status);
    console.log('Mensaje:', err.response.data);
  }

  const serverErrors =
    err?.response?.data?.errors;

  if (serverErrors && Array.isArray(serverErrors)) {
    const mapped = {};

    serverErrors.forEach((e) => {
      if (e.path) mapped[e.path] = e.msg;
    });

    setErrors(mapped);
  }

  setAlert({
    type: 'error',
    title: 'Error',
    message:
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      'No se pudo guardar el usuario',
    onClose: () => setAlert(null),
  });
} finally {

        setLoading(false);
        setSubmitting(false);

    }
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={
          isEdit
            ? 'Editar usuario'
            : 'Nuevo usuario'
        }
        subtitle="Completa los datos del usuario."
        icon={<FiUser />}
        footer={
          <>
            <button
              className={styles.btnOutline}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>

            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? 'Guardando...'
                : isEdit
                ? 'Guardar cambios'
                : 'Registrar usuario'}
            </button>
          </>
        }
      >

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >

          {/* DATOS */}

          <p className={styles.sectionTitle}>
            Datos del usuario
          </p>

          {/* ID */}

          <div className={styles.field}>

            <label className={styles.label}>
              Identificación *
            </label>

            <div className={styles.inputWrap}>

              <FiHash className={styles.inputIcon} />

              <input
                type="text"
                name="usuId"
                className={`${styles.input} ${
                  errors.usuId
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Ej. 123456"
                value={form.usuId}
                onChange={handleChange}
                disabled={isEdit}
              />

            </div>

            {errors.usuId && (
              <span className={styles.fieldError}>
                {errors.usuId}
              </span>
            )}

          </div>

          {/* NOMBRE */}

          <div className={styles.field}>

            <label className={styles.label}>
              Nombres *
            </label>

            <div className={styles.inputWrap}>

              <FiUser className={styles.inputIcon} />

              <input
                name="usuNom"
                className={`${styles.input} ${
                  errors.usuNom
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Ej. Carolina"
                value={form.usuNom}
                onChange={handleChange}
              />

            </div>

            {errors.usuNom && (
              <span className={styles.fieldError}>
                {errors.usuNom}
              </span>
            )}

          </div>

          {/* APELLIDO */}

          <div className={styles.field}>

            <label className={styles.label}>
              Apellidos *
            </label>

            <div className={styles.inputWrap}>

              <FiUser className={styles.inputIcon} />

              <input
                name="usuApe"
                className={`${styles.input} ${
                  errors.usuApe
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Ej. Ramírez"
                value={form.usuApe}
                onChange={handleChange}
              />

            </div>

            {errors.usuApe && (
              <span className={styles.fieldError}>
                {errors.usuApe}
              </span>
            )}

          </div>

          {/* TELÉFONO */}

          <div className={styles.field}>

            <label className={styles.label}>
              Teléfono *
            </label>

            <div className={styles.inputWrap}>

              <FiPhone className={styles.inputIcon} />

              <input
                type="text"
                name="usuTel"
                className={`${styles.input} ${
                  errors.usuTel
                    ? styles.inputError
                    : ''
                }`}
                placeholder="3001234567"
                value={form.usuTel}
                onChange={handleChange}
              />

            </div>

            {errors.usuTel && (
              <span className={styles.fieldError}>
                {errors.usuTel}
              </span>
            )}

          </div>

          {/* CORREO */}

          <div className={styles.field}>

            <label className={styles.label}>
              Correo *
            </label>

            <div className={styles.inputWrap}>

              <FiMail className={styles.inputIcon} />

              <input
                type="email"
                name="usuCor"
                className={`${styles.input} ${
                  errors.usuCor
                    ? styles.inputError
                    : ''
                }`}
                placeholder="usuario@gmail.com"
                value={form.usuCor}
                onChange={handleChange}
              />

            </div>

            {errors.usuCor && (
              <span className={styles.fieldError}>
                {errors.usuCor}
              </span>
            )}

          </div>

          {/* PASSWORD */}

          <div className={styles.field}>

            <label className={styles.label}>
              Contraseña {!isEdit && '*'}
            </label>

            <div className={styles.inputWrap}>

              <FiLock className={styles.inputIcon} />

              <input
                type="password"
                name="usuPassHash"
                className={`${styles.input} ${
                  errors.usuPassHash
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Mínimo 6 caracteres"
                value={form.usuPassHash}
                onChange={handleChange}
              />

            </div>

            {errors.usuPassHash && (
              <span className={styles.fieldError}>
                {errors.usuPassHash}
              </span>
            )}

          </div>

          {/* CONFIG */}

          <p className={styles.sectionTitle}>
            Configuración
          </p>

          {/* ROL */}

          <div className={styles.field}>

            <label className={styles.label}>
              Rol
            </label>

            <div className={styles.inputWrap}>

              <FiShield className={styles.inputIcon} />

              <select
                name="usuRol"
                className={styles.select}
                value={form.usuRol}
                onChange={handleChange}
              >
                <option value="ADMINISTRADOR">
                  ADMINISTRADOR
                </option>

                <option value="USUARIO">
                  USUARIO
                </option>

              </select>

            </div>

          </div>

          {/* SUPERVISOR */}

          <div className={styles.field}>

            <label className={styles.label}>
              Supervisor
            </label>

            <div className={styles.inputWrap}>

              <FiUsers className={styles.inputIcon} />

              <input
                type="text"
                name="usuSupFk"
                className={styles.input}
                placeholder="ID supervisor"
                value={form.usuSupFk}
                onChange={handleChange}
              />

            </div>

          </div>

        </form>

      </Drawer>

      {/* LOADING */}

      {loading && (

        <LoadingOverlay
          title="Guardando usuario..."
          message="Procesando solicitud"
        />

      )}

      {/* ALERT */}

      {alert && (

        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={alert.onClose}
        />

      )}

    </>
  );
};

export default UsuarioForm;