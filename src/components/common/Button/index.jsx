import styles from './btn.module.css';

const Button = ({ children, type, disabled, tipoDeEstilo, eventoClick }) => {
  const className = tipoDeEstilo ? styles.btnPrimary : styles.btnOutline;

  return (
    <button
      type={type}
      className={className}
      onClick={eventoClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
