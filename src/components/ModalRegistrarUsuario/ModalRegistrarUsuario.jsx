import { FiX, FiPlus, FiUserPlus } from 'react-icons/fi';
import styles from './modal-registrar-usuario.module.css';

const ModalRegistrarUsuario = ({
  show,
  onClose,
  form,
  onChange,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className={styles.modalContainer}>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Modal drawer */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
    <div>
      <div className={styles.titleWrapper}>
        <FiUserPlus className={styles.titleIcon} />

        <h2 className={styles.title}>
          Registrar Usuario
        </h2>
      </div>

      <p className={styles.subtitle}>
        Completa los datos para crear un nuevo usuario en el sistema.
      </p>
    </div>

    <button
      className={styles.closeBtn}
      onClick={onClose}
      aria-label="Cerrar modal"
    >
      <FiX />
    </button>
  </div>

        <form className={styles.body} onSubmit={onSubmit}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Datos del usuario</h3>

            <label className={styles.formGroup}>
              <span className={styles.label}>Identificación</span>
              <input
                type="text"
                name="usuId"
                placeholder="Ej. USR003"
                value={form.usuId}
                onChange={onChange}
                className={styles.input}
                required
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Nombres</span>
              <input
                type="text"
                name="usuNom"
                placeholder="Ej. Carolina"
                value={form.usuNom}
                onChange={onChange}
                className={styles.input}
                required
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Apellidos</span>
              <input
                type="text"
                name="usuApe"
                placeholder="Ej. Ramírez"
                value={form.usuApe}
                onChange={onChange}
                className={styles.input}
                required
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Teléfono</span>
              <input
                type="tel"
                name="usuTel"
                placeholder="Ej. +57 300 000 0000"
                value={form.usuTel}
                onChange={onChange}
                className={styles.input}
                required
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Correo</span>
              <input
                type="email"
                name="usuCor"
                placeholder="Ej. usuario@empresa.com"
                value={form.usuCor}
                onChange={onChange}
                className={styles.input}
                required
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Contraseña</span>
              <input
                type="password"
                name="usuPassHash"
                placeholder="Escribe una contraseña segura"
                value={form.usuPassHash}
                onChange={onChange}
                className={styles.input}
                required
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Configuración</h3>

            <label className={styles.formGroup}>
              <span className={styles.label}>Rol</span>
              <select
                name="usuRol"
                value={form.usuRol}
                onChange={onChange}
                className={styles.select}
              >
                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                <option value="USUARIO">USUARIO</option>
              </select>
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Supervisor</span>
              <input
                type="text"
                name="usuSupFk"
                placeholder="Opcional - ID del supervisor"
                value={form.usuSupFk}
                onChange={onChange}
                className={styles.input}
              />
            </label>

            <label className={styles.formGroup}>
              <span className={styles.label}>Estado</span>
              <select
                name="usuEst"
                value={form.usuEst}
                onChange={onChange}
                className={styles.select}
              >
                <option value="Activo">Activo</option>
                <option value="Bloqueado">Bloqueado</option>
              </select>
            </label>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSubmit}>
              <FiPlus /> Registrar usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistrarUsuario;
