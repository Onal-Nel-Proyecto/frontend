const Button = ({ children, active, type, eventoClick, tipoDeEstilo, disable }) => {

  const styleFinal = tipoDeEstilo
    ? {
        backgroundColor: active ? "#333" : "#1a1a1a",
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
        color: "#fff",
        border: "2px solid #fff",
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
      style={styleFinal}
      onClick={eventoClick}
      disabled={disable}
    >
      {children}
    </button>
  );
};

export default Button;