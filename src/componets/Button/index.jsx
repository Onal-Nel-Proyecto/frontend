import style from './btn.module.css';

const Botones = ({ children, active, type, eventoClick, tipoDeEstilo }) => {

  const styleFinal = tipoDeEstilo
    ? {
        backgroundColor: active ? "#333" : "var(--text-dark)",
        color: "white",
        border: "none",
        borderRadius: "12px",
        padding: "14px",
        width: "100%",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "0.3s",
        transform: active ? "translateY(-1px)" : "none"
      }
    : {
        backgroundColor: "transparent",
        color: "var(--white-200)",
        border: "2px solid var(--white-200)",
        borderRadius: "12px",
        padding: "14px",
        width: "100%",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "0.3s"
      };

  return (
    <button
      type={type}
      className={style.btn}
      style={styleFinal}
      onClick={eventoClick}
    >
      {children}
    </button>
  );
};

export default Botones;