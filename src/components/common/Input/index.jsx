import styles from './ipt.module.css';

const Input = ({ label, type, placeholder, name, value, onChange, error, maxLength }) => {
  return (
    <div className={`${styles.inputGroup} ${error ? styles.hasError : ''}`}>
      <label className={styles.label}>{label}</label>
      <input
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
      />
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};

export default Input;