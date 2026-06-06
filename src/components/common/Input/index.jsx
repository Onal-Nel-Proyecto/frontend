import styles from './ipt.module.css';

const Input = ({ label, type, placeholder, name, value, onChange, error, id }) => {
  const inputId = id || `input-${name}`;
  return (
    <div className={`${styles.inputGroup} ${error ? styles.hasError : ''}`}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && <span id={`${inputId}-error`} className={styles.fieldError} role="alert">{error}</span>}
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};

export default Input;