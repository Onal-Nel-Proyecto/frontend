// ================================================================
// Card — Componente reutilizable tipo "card" con fondo blanco
// semitransparente, backdrop-filter blur, bordes redondeados y
// sombra suave. Soporta hover con elevación.
//
// Props:
//   children  → contenido interno
//   className → clases CSS adicionales
//   onClick   → manejador de clic
//   as        → etiqueta HTML: 'div' (default) | 'button' | 'a'
// ================================================================

import styles from './card.module.css';

const Card = ({ children, className = '', onClick, as: Tag = 'div' }) => {
  return (
    <Tag className={`${styles.card} ${className}`} onClick={onClick}>
      {children}
    </Tag>
  );
};

export default Card;
