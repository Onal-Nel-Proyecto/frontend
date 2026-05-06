import styles from './ipt.module.css';

const Input = ({ label, type, placeholder }) => {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder} />
    </div>
  );
};

export default Input;