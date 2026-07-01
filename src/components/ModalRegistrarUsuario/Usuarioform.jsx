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
  FiEye,
  FiEyeOff,
  FiUsers, 
  FiKey
} from 'react-icons/fi';

import Drawer from '../common/Drawer';
import Alert from '../../components/ui/feedback/Alert';
import LoadingOverlay from '../../components/ui/feedback/LoadingOverlay';

import {
  createUsuario,
  updateUsuario,
  updatePassword,
} from '../../features/usuarios/services/user.services.js';
import { logoutUser } from '../../features/auth/services/authService';

import styles from './UsuarioForm.module.css';

const UsuarioForm = ({
  isOpen,
  onClose,
  usuario,
  onSuccess,
  usuarios,
}) => {

  const isEdit = !!usuario;
const usuarioSesion = JSON.parse(
  sessionStorage.getItem("user")
);
const esMismaSesion = isEdit && usuario?.id && usuarioSesion?.user_id && String(usuario.id) === String(usuarioSesion.user_id);
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
  usuPassHashConfirm: '',
  usuRol: usuario?.rol || 'USUARIO',
  usuSupFk: usuarioSesion?.user_id || '',
  usuEst: usuario?.estado === 1 ? 'Activo' : 'Bloqueado',
});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [alert,      setAlert]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});

  // Password modal state
  const [showPwModal, setShowPwModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState({});
  const [pwSubmitting, setPwSubmitting] = useState(false);

 useEffect(() => {

  if (usuario) {

    setForm({
      usuId: usuario.id || '',
      usuNom: usuario.nombres || '',
      usuApe: usuario.apellidos || '',
      usuTel: usuario.telefono || '',
      usuCor: usuario.correo || '',
      usuPassHash: '',
      usuPassHashConfirm: '',
      usuRol: usuario.rol || 'USUARIO',
      usuSupFk: usuario?.supervisorId || '',
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
      usuPassHashConfirm: '',
      usuRol: 'USUARIO',
      usuSupFk: '',
      usuEst: 'Activo',
    });

  }
  setPasswordActual('');
  setErrors({});
}, [usuario]);
  // ─────────────────────────────────────────
  // Handle Change
  // ─────────────────────────────────────────

   const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'usuId')  newValue = value.replace(/\D/g, '').slice(0, 12);
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

} else if (form.usuId.length > 12) {

  newErrors.usuId =
    'La identificación no puede tener más de 12 dígitos';

}

    // Nombre
    if (!form.usuNom.trim()) {

  newErrors.usuNom =
    'El nombre es requerido';

} else if (/\d/.test(form.usuNom)) {

  newErrors.usuNom =
    'El nombre no puede contener números';

} else if (form.usuNom.length > 200) {

  newErrors.usuNom =
    'El nombre es muy largo';

}

    // Apellido
    if (!form.usuApe.trim()) {

  newErrors.usuApe =
    'El apellido es requerido';

} else if (/\d/.test(form.usuApe)) {

  newErrors.usuApe =
    'El apellido no puede contener números';

} else if (form.usuApe.length > 200) {

  newErrors.usuApe =
    'El apellido es muy largo';

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

    } else if (form.usuCor.length > 254) {

      newErrors.usuCor =
    'El correo no puede superar los 254 caracteres';

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

    } else if (
          !isEdit &&
          form.usuPassHash.length > 15
        ) {

          newErrors.usuPassHash =
            'Máximo 15 caracteres';

        }

    // Confirmación de contraseña
    if (!isEdit && form.usuPassHash && !form.usuPassHashConfirm.trim()) {

      newErrors.usuPassHashConfirm =
        'La confirmación es requerida';

    } else if (
      !isEdit &&
      form.usuPassHash &&
      form.usuPassHashConfirm &&
      form.usuPassHash !== form.usuPassHashConfirm
    ) {

      newErrors.usuPassHashConfirm =
        'Las contraseñas no coinciden';

    }

    // Teléfono
      if (!form.usuTel.trim()) {

        newErrors.usuTel =
          'El teléfono es requerido';

      } else if (!/^\d+$/.test(form.usuTel)) {

        newErrors.usuTel =
          'Solo se permiten números';

      } else if (form.usuTel.length !== 10) {

        newErrors.usuTel =
          'Debe contener 10 dígitos';

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
      id:           form.usuId,
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
    console.log('======================');
    console.log('STATUS:', err.response.status);
    console.log('DATA:', err.response.data);
    console.log(
      'DATA JSON:',
      JSON.stringify(err.response.data, null, 2)
    );
    console.log('======================');
  }

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
  // Password change handler
  // ─────────────────────────────────────────

  const handleChangePassword = async (e) => {
  if (e?.preventDefault) e.preventDefault();

  const newErrors = {};

  if (esMismaSesion && !passwordActual) {
    newErrors.passwordActual = 'Debes ingresar tu contraseña actual';
  }

  if (!newPass || newPass.length < 6) {
    newErrors.newPass = 'Mínimo 6 caracteres';
  }

  if (newPass !== newPassConfirm) {
    newErrors.newPassConfirm = 'Las contraseñas no coinciden';
  }

  if (Object.keys(newErrors).length) {
    setPwErrors(newErrors);
    return;
  }

  setPwSubmitting(true);
  setLoading(true);

  try {
    const pwPayload = { password: newPass };
    if (esMismaSesion && passwordActual) {
      pwPayload.passwordActual = passwordActual;
    }
    await updatePassword(usuario.id, pwPayload);

    setShowPwModal(false);
    onClose();

    setTimeout(() => {
      setAlert({
        type: 'success',
        title: 'Contraseña actualizada',
        message: esMismaSesion
          ? 'La contraseña se actualizó correctamente. Se cerrará tu sesión por seguridad.'
          : 'La contraseña se actualizó correctamente',
        onClose: async () => {
          setAlert(null);
          if (esMismaSesion) {
            await logoutUser();
            sessionStorage.removeItem('user');
            window.location.href = '/login';
          }
        },
      });
    }, 400);

  } catch (err) {
    console.error('Error cambiando contraseña', err);

    setAlert({
      type: 'error',
      title: 'Error',
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        'No se pudo cambiar la contraseña',
      onClose: () => setAlert(null),
    });

  } finally {
    setLoading(false);
    setPwSubmitting(false);
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
                maxLength={12}
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
                maxLength={200}
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
                maxLength={200}
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
                maxLength={10}
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
                maxLength={254}
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

          {!isEdit ? (
            <>
              {/* PASSWORD */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Contraseña *
                </label>

                <div className={styles.inputWrap}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    type="password"
                    name="usuPassHash"
                    maxLength={15}
                    className={`${styles.input} ${errors.usuPassHash ? styles.inputError : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    value={form.usuPassHash}
                    onChange={handleChange}
                  />
                </div>

                {errors.usuPassHash && (
                  <span className={styles.fieldError}>{errors.usuPassHash}</span>
                )}
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              {form.usuPassHash && (
                <div className={styles.field}>
                  <label className={styles.label}>Confirmar contraseña *</label>
                  <div className={styles.inputWrap}>
                    <FiLock className={styles.inputIcon} />
                    <input
                      type="password"
                      name="usuPassHashConfirm"
                      maxLength={19}
                      className={`${styles.input} ${errors.usuPassHashConfirm ? styles.inputError : ''}`}
                      placeholder="Repetir contraseña"
                      value={form.usuPassHashConfirm}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.usuPassHashConfirm && (
                    <span className={styles.fieldError}>{errors.usuPassHashConfirm}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className={styles.changePasswordButton}
                onClick={() => setShowPwModal(true)}
              >
                <FiKey />
                Cambiar contraseña
              </button>
            </div>
          )}

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

              <select
                name="usuSupFk"
                className={styles.select}
                value={form.usuSupFk}
                onChange={handleChange}
              >
                <option value="">
                  Seleccione un supervisor
                </option>

                {usuarios
                  ?.filter(
                    (u) =>
                      (u.rol === "ADMINISTRADOR" ||
                      u.rol === "USUARIO") &&
                      u.estado === 1
                  )
                  .map((supervisor) => (
                    <option
                      key={supervisor.id}
                      value={supervisor.id}
                    >
                      {supervisor.nombres} {supervisor.apellidos}
                    </option>
                  ))}
              </select>
            </div>
          </div>

        </form>

      </Drawer>

      {/* Password modal */}

      <Drawer
        isOpen={showPwModal}
        onClose={() => setShowPwModal(false)}
        title="Cambiar contraseña"
        subtitle="Ingresa la nueva contraseña y verifica"
        icon={<FiLock />}
        footer={
          <>
            <button className={styles.btnOutline} type="button" onClick={() => setShowPwModal(false)} disabled={pwSubmitting}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} type="button" onClick={handleChangePassword} disabled={pwSubmitting}>
              {pwSubmitting ? 'Cambiando...' : 'Cambiar'}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          {esMismaSesion && (
            <div className={styles.field}>
              <label className={styles.label}>Contraseña anterior</label>
              <div className={styles.inputWrap}>
                <FiLock className={styles.inputIcon} />
                <input
                  type="password"
                  name="passwordActual"
                  className={`${styles.input} ${pwErrors.passwordActual ? styles.inputError : ''}`}
                  placeholder="Ingresa tu contraseña actual"
                  value={passwordActual}
                  onChange={(e) => {
                    setPasswordActual(e.target.value);
                    if (pwErrors.passwordActual) {
                      setPwErrors((prev) => ({ ...prev, passwordActual: '' }));
                    }
                  }}
                />
              </div>
              {pwErrors.passwordActual && (
                <span className={styles.fieldError}>{pwErrors.passwordActual}</span>
              )}
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Contraseña nueva</label>
            <div className={styles.inputWrap}>
              <FiLock className={styles.inputIcon} />

              <input
                type={showPassword ? 'text' : 'password'}
                name="newPass"
                className={`${styles.input} ${pwErrors.newPass ? styles.inputError : ''}`}
                placeholder="Mínimo 6 caracteres"
                value={newPass}
                onChange={(e) => {
                  setNewPass(e.target.value);

                  if (pwErrors.newPass) {
                    setPwErrors((prev) => ({
                      ...prev,
                      newPass: '',
                    }));
                  }
                }}
              />

              <button
                type="button"
                className={styles.eyeButton}
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>
            </div>
            {pwErrors.newPass && <span className={styles.fieldError}>{pwErrors.newPass}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Verificar contraseña</label>
            <div className={styles.inputWrap}>
              <FiLock className={styles.inputIcon} />
              <input
                type="password"
                name="newPassConfirm"
                className={`${styles.input} ${pwErrors.newPassConfirm ? styles.inputError : ''}`}
                placeholder="Repetir contraseña"
                value={newPassConfirm}
                onChange={(e) => {
                  setNewPassConfirm(e.target.value);
                  if (pwErrors.newPassConfirm) setPwErrors((prev) => ({ ...prev, newPassConfirm: '' }));
                }}
              />
            </div>
            {pwErrors.newPassConfirm && <span className={styles.fieldError}>{pwErrors.newPassConfirm}</span>}
          </div>
        </div>
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