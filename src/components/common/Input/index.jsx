import styles from './ipt.module.css';

const Input = ({ label, type, placeholder, name, value, onChange }) => {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{label}</label>
      <input 
      className={styles.input} 
      type={type} 
      placeholder={placeholder} 
      name={name}
      value={value}
      onChange={onChange}/>
    </div>
  );
};

export default Input;