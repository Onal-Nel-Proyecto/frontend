import styles from './card.module.css';

/**
 * Componente Card reutilizable.
 * Fondo blanco semitransparente + backdrop-filter, bordes redondeados, sombra.
 *
 * @param {{ children, className, onClick, as }} props
 *   - as: 'div' (default) | 'button' | 'a' — cambia la etiqueta HTML
 */
const Card = ({ children, className = '', onClick, as: Tag = 'div' }) => {
  return (
    <Tag
      className={`${styles.card} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
};

export default Card;
