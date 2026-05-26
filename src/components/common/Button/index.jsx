const Button = ({ children, active, type, eventoClick, tipoDeEstilo, disable }) => {

  const styleFinal = tipoDeEstilo
    ? {
        backgroundColor: active ? "#B8922E" : "#C9A23D",
        color: "#ffffff",
        border: "none",
        borderRadius: "14px",
        padding: "14px 20px",
        width: "100%",
        fontSize: "1rem",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: active ? "translateY(-1px)" : "none",
        boxShadow: active
          ? "0 6px 20px rgba(201, 162, 61, 0.35)"
          : "0 4px 12px rgba(201, 162, 61, 0.2)",
        letterSpacing: "0.5px"
      }
    : {
        backgroundColor: "transparent",
        color: "#C9A23D",
        border: "2px solid #C9A23D",
        borderRadius: "14px",
        padding: "14px 20px",
        width: "100%",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease"
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