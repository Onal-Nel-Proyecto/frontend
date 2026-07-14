// ================================================================
// useFocusTrap — Atrapa el foco dentro de un contenedor modal
// para cumplir WCAG 2.1 — 2.4.3 Focus Order.
//
// Uso:
//   const focusTrapRef = useFocusTrap(isOpen);
//   return <div ref={focusTrapRef}>…</div>
// ================================================================

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * @param {boolean} active — Activar/desactivar el trap
 * @param {{ initialFocus?: boolean }} opts
 * @returns {React.RefObject} ref para asignar al contenedor
 */
export const useFocusTrap = (active, opts = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const previousFocus = document.activeElement;

    // Mover foco al primer elemento focusable dentro del contenedor
    const focusFirst = () => {
      const focusable = container.querySelectorAll(FOCUSABLE);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.setAttribute("tabindex", "-1");
        container.focus();
      }
    };

    // Al abrir, enfocar el primer elemento
    focusFirst();

    // Atrapar foco cíclicamente
    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const focusable = container.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: si está en el primero, saltar al último
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: si está en el último, saltar al primero
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restaurar foco anterior al cerrar
      if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
      }
    };
  }, [active]);

  return ref;
};
